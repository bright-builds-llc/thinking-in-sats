import type {
  EverydayItemWithSats,
  QuizChoiceView,
  QuizQuestion,
  QuizQuestionResult,
} from "./itemTypes";
import { formatBtcAmount, formatSats } from "./formatting";

export type { QuizChoiceView as QuizChoice, QuizQuestionResult };

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

function buildDistractors(correctSats: number): [number, number] {
  const lowerCandidate = Math.max(1, roundToTeachingValue(correctSats / 10));
  const upperCandidate = roundToTeachingValue(correctSats * 10);

  if (lowerCandidate !== correctSats && upperCandidate !== correctSats) {
    return [lowerCandidate, upperCandidate];
  }

  return [
    Math.max(1, roundToTeachingValue(correctSats / 3)),
    roundToTeachingValue(correctSats * 3),
  ];
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
  const [lowerChoice, upperChoice] = buildDistractors(correctChoiceSatAmount);
  const choices = shuffleChoices([
    createChoice(`choice-${lowerChoice}`, lowerChoice, false),
    createChoice(`choice-${correctChoiceSatAmount}`, correctChoiceSatAmount, true),
    createChoice(`choice-${upperChoice}`, upperChoice, false),
  ]);
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
