import { render, screen, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EverydayItem } from "../domain/itemTypes";
import type { QuoteState } from "../domain/quoteCache";
import { QuizPage } from "./QuizPage";

const items: EverydayItem[] = [
  {
    id: "coffee",
    name: "Coffee",
    category: "food-drink",
    approxUsdCents: 500,
    description: "A quick cup from the neighborhood cafe.",
    featuredOnTimeline: true,
  },
  {
    id: "lunch",
    name: "Lunch",
    category: "food-drink",
    approxUsdCents: 1_500,
    description: "A casual midday meal.",
    featuredOnTimeline: true,
  },
];

const quoteState: QuoteState = {
  status: "ready",
  currentQuote: {
    usdPerBitcoin: 100_000,
    fetchedAt: 1_710_000_000_000,
    source: "coingecko",
  },
  maybeError: null,
  isStale: false,
};

function createRect(top: number, height = 0): DOMRect {
  return {
    bottom: top + height,
    height,
    left: 0,
    right: 0,
    top,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function flushMicrotask(): Promise<void> {
  return Promise.resolve();
}

describe("QuizPage", () => {
  afterEach(() => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 0,
      writable: true,
    });
    vi.restoreAllMocks();
  });

  it("does not reveal the target sats amount before the learner answers", () => {
    // Arrange
    render(() => <QuizPage items={items} quoteState={quoteState} />);

    // Assert
    expect(screen.getByText("Any rank can be right")).toBeInTheDocument();
    expect(screen.queryByText(/Best guess near/i)).not.toBeInTheDocument();
  });

  it("advances to the next item after the learner answers", async () => {
    // Arrange
    const user = userEvent.setup();
    render(() => <QuizPage items={items} quoteState={quoteState} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Lunch" }),
    ).toBeInTheDocument();
    const choiceButtons = within(
      screen.getByRole("list", { name: "Quiz answer choices" }),
    ).getAllByRole("button");

    // Act
    await user.click(choiceButtons[0]!);
    await user.click(screen.getByRole("button", { name: "Next item" }));

    // Assert
    expect(
      await screen.findByRole("heading", { level: 2, name: "Coffee" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Lunch" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Question #2")).toBeInTheDocument();
  });

  it("smoothly scrolls back to the question card after advancing", async () => {
    // Arrange
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 480,
      writable: true,
    });
    const scrollToSpy = vi
      .spyOn(window, "scrollTo")
      .mockImplementation(() => undefined);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function mockGetBoundingClientRect(this: HTMLElement) {
        if (this.classList.contains("quiz-layout")) {
          return createRect(-180, 320);
        }

        return createRect(0, 0);
      },
    );

    render(() => <QuizPage items={items} quoteState={quoteState} />);
    const choiceButtons = within(
      screen.getByRole("list", { name: "Quiz answer choices" }),
    ).getAllByRole("button");
    await user.click(choiceButtons[0]!);

    // Act
    await user.click(screen.getByRole("button", { name: "Next item" }));
    await flushMicrotask();

    // Assert
    expect(
      await screen.findByRole("heading", { level: 2, name: "Coffee" }),
    ).toBeInTheDocument();
    expect(scrollToSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      top: 284,
    });
  });
});
