import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { QuoteState } from "../services/quoteStore";
import { HomePage } from "./HomePage";

vi.mock("@solidjs/router", () => ({
  A: (props: {
    children?: JSX.Element;
    class?: string;
    href?: string;
  }) => (
    <a class={props.class} href={props.href}>
      {props.children}
    </a>
  ),
}));

function mockMatchMedia(matches: boolean) {
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: matchMedia,
    writable: true,
  });
}

const quoteState: QuoteState = {
  status: "ready",
  currentQuote: {
    usdPerBitcoin: 100_000,
    fetchedAt: 1_710_000_000_000,
    sourceLabel: "CoinGecko",
  },
  maybeError: null,
  isStale: false,
};

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "#/");
  Reflect.deleteProperty(window, "matchMedia");
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

describe("HomePage", () => {
  it("scrolls the vertical sats line into view from the hero", () => {
    // Arrange
    mockMatchMedia(false);
    const { container, getByRole } = render(() => (
      <HomePage quoteState={quoteState} />
    ));
    const timeline = container.querySelector<HTMLElement>("#timeline");
    const scrollIntoView = vi.fn();

    if (!timeline) {
      throw new Error("Expected the vertical sats line to render.");
    }

    timeline.scrollIntoView = scrollIntoView;

    // Act
    fireEvent.click(
      getByRole("button", { name: "Explore prices in sats" }),
    );

    // Assert
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("scrolls the vertical sats line into view after targeted route navigation", () => {
    // Arrange
    mockMatchMedia(false);
    window.history.replaceState(null, "", "#/#timeline");
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    // Act
    render(() => <HomePage quoteState={quoteState} />);

    // Assert
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("renders the simplified hero copy without item-count chips", () => {
    // Arrange
    mockMatchMedia(false);

    // Act
    const { queryByText } = render(() => <HomePage quoteState={quoteState} />);

    // Assert
    expect(
      queryByText(
        "Learn to think in sats by seeing how much familiar everyday purchases cost, below. Then take a quiz to test your intuition.",
      ),
    ).toBeInTheDocument();
    expect(queryByText("32 featured anchors")).not.toBeInTheDocument();
    expect(queryByText("68 everyday items total")).not.toBeInTheDocument();
  });

  it("does not label the timeline as the main visualization", () => {
    // Arrange
    mockMatchMedia(false);

    // Act
    const { queryByText } = render(() => <HomePage quoteState={quoteState} />);

    // Assert
    expect(queryByText("Main visualization")).not.toBeInTheDocument();
  });

  it("places the explanatory cards after the vertical sats line", () => {
    // Arrange
    mockMatchMedia(false);

    // Act
    const { container, getByRole } = render(() => (
      <HomePage quoteState={quoteState} />
    ));
    const timeline = container.querySelector("#timeline");
    const explainer = getByRole("heading", {
      name: "Why a logarithmic line?",
    }).closest(".timeline-help");

    // Assert
    expect(timeline).toBeInTheDocument();
    expect(explainer).toBeInTheDocument();
    expect(
      (timeline?.compareDocumentPosition(explainer as Node) ?? 0) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("does not render the retired Method pane", () => {
    // Arrange
    mockMatchMedia(false);

    // Act
    const { queryByRole } = render(() => <HomePage quoteState={quoteState} />);

    // Assert
    expect(
      queryByRole("heading", { name: "How to read the values" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the timeline in desktop lanes above the mobile breakpoint", () => {
    // Arrange
    mockMatchMedia(false);

    // Act
    const { container } = render(() => <HomePage quoteState={quoteState} />);

    // Assert
    expect(container.querySelector(".timeline-mobile-list")).not.toBeInTheDocument();
    expect(container.querySelector(".timeline-item--left")).toBeInTheDocument();
    expect(container.querySelector(".timeline-item--right")).toBeInTheDocument();
    expect(container.querySelector(".timeline-item--center")).not.toBeInTheDocument();
  });

  it("switches the timeline into a stacked mobile list at the mobile breakpoint", () => {
    // Arrange
    mockMatchMedia(true);

    // Act
    const { container } = render(() => <HomePage quoteState={quoteState} />);

    // Assert
    expect(container.querySelector(".timeline-mobile-list")).toBeInTheDocument();
    expect(container.querySelector(".timeline-stage")).not.toBeInTheDocument();
    expect(container.querySelector(".timeline-item--center")).toBeInTheDocument();
    expect(container.querySelector(".timeline-item--left")).not.toBeInTheDocument();
    expect(container.querySelector(".timeline-item--right")).not.toBeInTheDocument();
  });
});
