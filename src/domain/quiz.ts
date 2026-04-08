import type {
  EverydayItemWithSats,
  QuizChoiceView,
  QuizQuestion,
  QuizQuestionResult,
} from "./itemTypes";
import { formatBtcAmount, formatSats } from "./formatting";

export type { QuizChoiceView as QuizChoice, QuizQuestionResult };

type CorrectChoiceRank = "lowest" | "middle" | "highest";

const correctChoiceRanks: CorrectChoiceRank[] = ["lowest", "middle", "highest"];

const choiceFactorsByRank: Record<
  CorrectChoiceRank,
  readonly [number, number, number]
> = {
  lowest: [1, 10, 100],
  middle: [0.1, 1, 10],
  highest: [0.01, 0.1, 1],
};

const fallbackChoiceRanksByRank: Record<
  CorrectChoiceRank,
  readonly [CorrectChoiceRank, CorrectChoiceRank]
> = {
  lowest: ["middle", "highest"],
  middle: ["lowest", "highest"],
  highest: ["middle", "lowest"],
};

function roundToTeachingValue(value: number): number {
  if (value <= 0) {
    return 1;
  }

  const exponent = Math.floor(Math.log10(value));
  const normalizedValue = value / 10 ** exponent;

  if (normalizedValue < 1.5) {
    return 10 ** exponent;
  }

  if (normalizedValue < 3.5) {
    return 1.5 * 10 ** exponent;
  }

  if (normalizedValue < 7.5) {
    return 5 * 10 ** exponent;
  }

  return 10 ** (exponent + 1);
}

function createChoice(id: string, sats: number, isCorrect: boolean): QuizChoiceView {
  return {
    id,
    sats,
    isCorrect,
    label: formatSats(sats),
    supportingText: formatBtcAmount(sats),
  };
}

function shuffleChoices(choices: QuizChoiceView[]): QuizChoiceView[] {
  const shuffledChoices = [...choices];

  for (let index = shuffledChoices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const nextChoice = shuffledChoices[index];
    shuffledChoices[index] = shuffledChoices[swapIndex];
    shuffledChoices[swapIndex] = nextChoice;
  }

  return shuffledChoices;
}

function hashString(value: string): number {
  return Array.from(value).reduce((total, character, index) => {
    return total + character.charCodeAt(0) * (index + 1);
  }, 0);
}

function selectCorrectChoiceRank(itemId: string): CorrectChoiceRank {
  const rankIndex = hashString(itemId) % correctChoiceRanks.length;
  const maybeCorrectChoiceRank = correctChoiceRanks[rankIndex];

  if (!maybeCorrectChoiceRank) {
    return "middle";
  }

  return maybeCorrectChoiceRank;
}

function maybeBuildChoiceValuesForRank(
  correctSats: number,
  correctChoiceRank: CorrectChoiceRank,
): number[] | null {
  const choiceValues = [
    ...new Set(
      choiceFactorsByRank[correctChoiceRank].map((factor) =>
        roundToTeachingValue(correctSats * factor),
      ),
    ),
  ].sort((left, right) => left - right);

  if (choiceValues.length !== 3) {
    return null;
  }

  return choiceValues;
}

function buildChoiceValues(itemId: string, correctSats: number): number[] {
  const preferredCorrectChoiceRank = selectCorrectChoiceRank(itemId);
  const correctChoiceRanksToTry = [
    preferredCorrectChoiceRank,
    ...fallbackChoiceRanksByRank[preferredCorrectChoiceRank],
  ];

  for (const correctChoiceRank of correctChoiceRanksToTry) {
    const maybeChoiceValues = maybeBuildChoiceValuesForRank(
      correctSats,
      correctChoiceRank,
    );

    if (maybeChoiceValues) {
      return maybeChoiceValues;
    }
  }

  throw new Error("Quiz question generation failed.");
}

export function selectNextQuizItem(
  items: EverydayItemWithSats[],
  questionIndex: number,
  maybePreviousItemId?: string,
): EverydayItemWithSats {
  if (items.length === 0) {
    throw new Error("Quiz items are required.");
  }

  const candidateIndex = (questionIndex * 7 + 3) % items.length;
  const candidateItem = items[candidateIndex];

  if (items.length === 1 || candidateItem.id !== maybePreviousItemId) {
    return candidateItem;
  }

  return items[(candidateIndex + 1) % items.length];
}

export function createQuizQuestion(item: EverydayItemWithSats): QuizQuestion {
  const correctChoiceSatAmount = roundToTeachingValue(item.satValue);
  const choiceValues = buildChoiceValues(item.id, correctChoiceSatAmount);
  const choices = shuffleChoices(
    choiceValues.map((choiceValue) =>
      createChoice(
        `choice-${choiceValue}`,
        choiceValue,
        choiceValue === correctChoiceSatAmount,
      ),
    ),
  );
  const correctChoice = choices.find((choice) => choice.isCorrect);

  if (!correctChoice) {
    throw new Error("Quiz question generation failed.");
  }

  return {
    item,
    choices,
    correctChoiceId: correctChoice.id,
    correctChoiceSatAmount,
  };
}

export function evaluateQuizAnswer(
  question: QuizQuestion,
  selectedChoiceId: string,
): QuizQuestionResult {
  const maybeSelectedChoice = question.choices.find(
    (choice) => choice.id === selectedChoiceId,
  );
  const maybeCorrectChoice = question.choices.find((choice) => choice.isCorrect);

  if (!maybeSelectedChoice || !maybeCorrectChoice) {
    throw new Error("Quiz answer evaluation failed.");
  }

  return {
    isCorrect: maybeSelectedChoice.id === maybeCorrectChoice.id,
    selectedChoice: maybeSelectedChoice,
    correctChoice: maybeCorrectChoice,
  };
}
