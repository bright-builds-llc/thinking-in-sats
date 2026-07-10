import { render, screen, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formatApproxUsd } from "../domain/formatting";
import type { EverydayItem } from "../domain/itemTypes";
import type { QuoteState } from "../services/quoteStore";
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

function createQuizItems(count: number): EverydayItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`,
    name: `Item ${index + 1}`,
    category: "food-drink",
    approxUsdCents: 100 + index * 100,
    description: `Description for item ${index + 1}.`,
    featuredOnTimeline: true,
  }));
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

function readRequiredText(root: ParentNode, selector: string): string {
  const maybeText = root.querySelector<HTMLElement>(selector)?.textContent?.trim();

  if (!maybeText) {
    throw new Error(`Expected text for selector: ${selector}`);
  }

  return maybeText;
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
    expect(screen.queryByText("Any rank can be right")).not.toBeInTheDocument();
    expect(screen.queryByText(/Best guess near/i)).not.toBeInTheDocument();
  });

  it("advances to the next item after the learner answers", async () => {
    // Arrange
    const user = userEvent.setup();
    render(() => <QuizPage items={items} quoteState={quoteState} />);
    const choiceButtons = within(
      screen.getByRole("list", { name: "Quiz answer choices" }),
    ).getAllByRole("button");

    // Act
    await user.click(choiceButtons[0]!);
    await user.click(screen.getByRole("button", { name: "Next item" }));

    // Assert
    expect(await screen.findByText("Question 2 of 2")).toBeInTheDocument();
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
    expect(await screen.findByText("Question 2 of 2")).toBeInTheDocument();
    expect(scrollToSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      top: 284,
    });
  });

  it("finishes after ten questions and shows the score screen", async () => {
    // Arrange
    const user = userEvent.setup();
    let expectedCorrectAnswers = 0;
    render(() => (
      <QuizPage items={createQuizItems(12)} quoteState={quoteState} />
    ));

    // Act
    for (let questionNumber = 1; questionNumber <= 10; questionNumber += 1) {
      expect(
        screen.getByText(`Question ${questionNumber} of 10`),
      ).toBeInTheDocument();
      const choiceButtons = within(
        screen.getByRole("list", { name: "Quiz answer choices" }),
      ).getAllByRole("button");
      await user.click(choiceButtons[0]!);
      if (
        screen.queryByRole("heading", {
          level: 3,
          name: "Nice — that is the right price range.",
        })
      ) {
        expectedCorrectAnswers += 1;
      }
      await user.click(
        screen.getByRole("button", {
          name: questionNumber === 10 ? "See my score" : "Next item",
        }),
      );
    }

    // Assert
    expect(
      screen.getByRole("heading", { level: 2, name: "Quiz complete" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${expectedCorrectAnswers} out of 10`),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Share my score" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Play again" }),
    ).toBeInTheDocument();
  });

  it("starts a fresh session from the completion screen", async () => {
    // Arrange
    const user = userEvent.setup();
    render(() => <QuizPage items={items} quoteState={quoteState} />);
    for (let questionNumber = 1; questionNumber <= 2; questionNumber += 1) {
      const choiceButtons = within(
        screen.getByRole("list", { name: "Quiz answer choices" }),
      ).getAllByRole("button");
      await user.click(choiceButtons[0]!);
      await user.click(
        screen.getByRole("button", {
          name: questionNumber === 2 ? "See my score" : "Next item",
        }),
      );
    }

    // Act
    await user.click(screen.getByRole("button", { name: "Play again" }));

    // Assert
    expect(screen.getByText("Question 1 of 2")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 2, name: "Quiz complete" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Review your answers")).not.toBeInTheDocument();
  });

  it("preserves each selected answer in an expandable completion report", async () => {
    // Arrange
    const user = userEvent.setup();
    const expectedAnswers: Array<{
      correctLabel: string;
      isCorrect: boolean;
      itemName: string;
      selectedLabel: string;
      usdAnchor: string;
    }> = [];
    render(() => <QuizPage items={items} quoteState={quoteState} />);

    // Act
    for (let questionNumber = 1; questionNumber <= 2; questionNumber += 1) {
      const itemName = readRequiredText(document, ".quiz-card__name");
      const choiceButtons = within(
        screen.getByRole("list", { name: "Quiz answer choices" }),
      ).getAllByRole("button");
      const selectedButton = choiceButtons[0]!;
      const selectedLabel = readRequiredText(
        selectedButton,
        ".quiz-choice__label",
      );
      await user.click(selectedButton);
      const correctLabel = readRequiredText(
        document,
        ".quiz-choice--correct .quiz-choice__label",
      );
      const maybeItem = items.find((item) => item.name === itemName);

      if (!maybeItem) {
        throw new Error(`Expected fixture item: ${itemName}`);
      }

      expectedAnswers.push({
        correctLabel,
        isCorrect: selectedLabel === correctLabel,
        itemName,
        selectedLabel,
        usdAnchor: formatApproxUsd(maybeItem.approxUsdCents),
      });
      await user.click(
        screen.getByRole("button", {
          name: questionNumber === 2 ? "See my score" : "Next item",
        }),
      );
    }

    const reportSummary = screen.getByText("Review your answers");
    const maybeReport = reportSummary.closest("details");

    if (!maybeReport) {
      throw new Error("Expected the answer report to use a details element.");
    }

    expect(maybeReport).not.toHaveAttribute("open");
    await user.click(reportSummary);

    // Assert
    expect(maybeReport).toHaveAttribute("open");
    const reportEntries = within(
      within(maybeReport).getByRole("list", { name: "Quiz answer report" }),
    ).getAllByRole("listitem");
    expect(reportEntries).toHaveLength(2);

    expectedAnswers.forEach((expectedAnswer, index) => {
      const reportEntry = reportEntries[index]!;
      expect(
        within(reportEntry).getByRole("heading", {
          level: 3,
          name: `${index + 1}. ${expectedAnswer.itemName}`,
        }),
      ).toBeInTheDocument();
      expect(
        within(reportEntry).getByLabelText(
          `Your answer: ${expectedAnswer.selectedLabel}`,
        ),
      ).toBeInTheDocument();
      expect(
        within(reportEntry).getByLabelText(
          `Correct answer: ${expectedAnswer.correctLabel}`,
        ),
      ).toBeInTheDocument();
      expect(
        within(reportEntry).getByText(
          expectedAnswer.isCorrect ? "Correct" : "Review this one",
        ),
      ).toBeInTheDocument();
      expect(
        within(reportEntry).getByText(
          `Approximate dollar anchor: ${expectedAnswer.usdAnchor}`,
        ),
      ).toBeInTheDocument();
    });
  });
});
