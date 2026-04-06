import { describe, expect, it } from "vitest";

import type { EverydayItemWithSats } from "./itemTypes";
import { itemCategoryLabels } from "./itemTypes";
import { createQuizQuestion, evaluateQuizAnswer } from "./quiz";

const item: EverydayItemWithSats = {
  id: "chipotle-burrito",
  name: "Chipotle burrito",
  category: "food-drink",
  approxUsdCents: 1_000,
  description: "A loaded burrito with rice, beans, and protein.",
  featuredOnTimeline: true,
  satValue: 15_000,
  btcValue: 0.00015,
  categoryLabel: itemCategoryLabels["food-drink"],
};

describe("createQuizQuestion", () => {
  it("creates three choices with a single correct answer", () => {
    // Act
    const question = createQuizQuestion(item);

    // Assert
    expect(question.choices).toHaveLength(3);
    expect(question.choices.filter((choice) => choice.isCorrect)).toHaveLength(1);
    expect(question.correctChoiceId).toBe(
      question.choices.find((choice) => choice.isCorrect)?.id,
    );
  });

  it("spreads distractors by rough orders of magnitude", () => {
    // Act
    const question = createQuizQuestion(item);
    const sortedValues = [...question.choices]
      .map((choice) => choice.sats)
      .sort((left, right) => left - right);

    // Assert
    expect(sortedValues[1] / sortedValues[0]).toBeGreaterThanOrEqual(5);
    expect(sortedValues[2] / sortedValues[1]).toBeGreaterThanOrEqual(5);
  });
});

describe("evaluateQuizAnswer", () => {
  it("reports whether the selected choice is correct", () => {
    // Arrange
    const question = createQuizQuestion(item);
    const correctChoiceId = question.correctChoiceId;
    const incorrectChoiceId = question.choices.find(
      (choice) => !choice.isCorrect,
    )!.id;

    // Act
    const correctResult = evaluateQuizAnswer(question, correctChoiceId);
    const incorrectResult = evaluateQuizAnswer(question, incorrectChoiceId);

    // Assert
    expect(correctResult.isCorrect).toBe(true);
    expect(incorrectResult.isCorrect).toBe(false);
    expect(correctResult.correctChoice.id).toBe(correctChoiceId);
    expect(incorrectResult.correctChoice.id).toBe(correctChoiceId);
  });
});
