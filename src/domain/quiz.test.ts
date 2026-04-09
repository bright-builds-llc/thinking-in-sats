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

function getSortedChoiceValues(question: ReturnType<typeof createQuizQuestion>): number[] {
  return [...question.choices]
    .map((choice) => choice.sats)
    .sort((left, right) => left - right);
}

function getCorrectChoiceRank(
  question: ReturnType<typeof createQuizQuestion>,
): "lowest" | "middle" | "highest" {
  const sortedChoiceValues = getSortedChoiceValues(question);

  if (question.correctChoiceSatAmount === sortedChoiceValues[0]) {
    return "lowest";
  }

  if (question.correctChoiceSatAmount === sortedChoiceValues[1]) {
    return "middle";
  }

  return "highest";
}

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
    const sortedValues = getSortedChoiceValues(question);

    // Assert
    expect(sortedValues[1] / sortedValues[0]).toBeGreaterThanOrEqual(5);
    expect(sortedValues[2] / sortedValues[1]).toBeGreaterThanOrEqual(5);
  });

  it("lets the correct answer land low, middle, or high", () => {
    // Arrange
    const lowRankItem = { ...item, id: "c" };
    const middleRankItem = { ...item, id: "a" };
    const highRankItem = { ...item, id: "b" };

    // Act
    const lowRankQuestion = createQuizQuestion(lowRankItem);
    const middleRankQuestion = createQuizQuestion(middleRankItem);
    const highRankQuestion = createQuizQuestion(highRankItem);

    // Assert
    expect(getCorrectChoiceRank(lowRankQuestion)).toBe("lowest");
    expect(getCorrectChoiceRank(middleRankQuestion)).toBe("middle");
    expect(getCorrectChoiceRank(highRankQuestion)).toBe("highest");
  });

  it("falls back to a valid spread when an extreme rank would duplicate values", () => {
    // Arrange
    const tinyItem: EverydayItemWithSats = {
      ...item,
      id: "b",
      satValue: 5,
      btcValue: 0.00000005,
    };

    // Act
    const question = createQuizQuestion(tinyItem);

    // Assert
    expect(getSortedChoiceValues(question)).toEqual([1, 5, 50]);
    expect(getCorrectChoiceRank(question)).toBe("middle");
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
