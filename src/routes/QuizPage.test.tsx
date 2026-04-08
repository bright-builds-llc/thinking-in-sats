import { render, screen, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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

describe("QuizPage", () => {
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
});
