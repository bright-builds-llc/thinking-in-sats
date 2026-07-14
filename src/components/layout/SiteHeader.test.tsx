import { HashRouter, Route } from "@solidjs/router";
import { render, screen, waitFor, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { QuoteState } from "../../services/quoteStore";
import { HomePage } from "../../routes/HomePage";
import { SiteHeader } from "./SiteHeader";

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

function HeaderRouterShell(props: { children?: JSX.Element }) {
  return (
    <>
      <SiteHeader />
      <main>{props.children}</main>
    </>
  );
}

function renderHeaderRoutes() {
  return render(() => (
    <HashRouter root={HeaderRouterShell}>
      <Route path="/" component={() => <HomePage quoteState={quoteState} />} />
      <Route path="/quiz" component={() => <h1>Quiz route</h1>} />
    </HashRouter>
  ));
}

describe("SiteHeader", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#/quiz");
    window.scrollTo = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    vi.restoreAllMocks();
  });

  it("navigates from the quiz route to the line route through the header menu", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHeaderRoutes();

    // Act
    await user.click(screen.getByRole("button", { name: "Menu" }));

    const menu = await screen.findByRole("menu");
    const lineItem = within(menu).getByRole("menuitem", { name: "Line" });
    await user.click(lineItem);

    // Assert
    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
    expect(window.location.hash).toBe("#/#timeline");
    expect(
      await screen.findByRole("heading", { name: "Thinking In Sats" }),
    ).toBeInTheDocument();
  });
});
