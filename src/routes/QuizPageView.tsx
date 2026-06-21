import { QuizCard } from "../components/quiz/QuizCard";
import { QuizChoices } from "../components/quiz/QuizChoices";
import { QuizFeedback } from "../components/quiz/QuizFeedback";
import {
  formatApproxUsd,
  formatBtcValue,
  formatSatLabel,
} from "../domain/formatting";
import type {
  EverydayItemWithSats,
  QuizQuestion,
  QuizQuestionResult,
} from "../domain/itemTypes";

export type QuizView = {
  currentItem: EverydayItemWithSats;
  question: QuizQuestion;
};

type QuizQuestionLayoutProps = {
  maybeResult: QuizQuestionResult | null;
  maybeSelectedChoiceId: string | null;
  onChoiceSelect: (choiceId: string) => void;
  onNextQuestion: () => void;
  onQuizLayoutRef: (element: HTMLDivElement) => void;
  questionIndex: number;
  quizView: QuizView;
};

export function QuizPageIntro() {
  return (
    <div class="section-heading">
      <span class="eyebrow">Quiz</span>
      <h1>Train your sats intuition</h1>
      <p class="lede">
        Each question uses wide power-of-ten choices so you can focus on
        building rough mental models before you think about dollars.
      </p>
    </div>
  );
}

export function QuizQuoteFallback() {
  return (
    <div class="surface-card">
      <p class="lede">
        We need a live BTC/USD quote before we can turn quiz items into sats.
      </p>
    </div>
  );
}

export function QuizQuestionLayout(props: QuizQuestionLayoutProps) {
  return (
    <div class="quiz-layout" ref={props.onQuizLayoutRef}>
      <QuizCard item={props.quizView.currentItem} />

      <div class="surface-card quiz-panel">
        <div class="quiz-panel__header">
          <span class="stat-chip">Question #{props.questionIndex + 1}</span>
          <span class="stat-chip">Any rank can be right</span>
        </div>

        <QuizChoices
          choices={props.quizView.question.choices}
          hasAnswered={Boolean(props.maybeResult)}
          selectedChoiceId={props.maybeSelectedChoiceId}
          onSelect={props.onChoiceSelect}
        />

        <QuizFeedback
          isVisible={Boolean(props.maybeResult)}
          isCorrect={props.maybeResult?.isCorrect ?? false}
          explanation={`This item lands near ${formatSatLabel(
            props.quizView.question.correctChoiceSatAmount,
          )}, or ${formatBtcValue(
            props.quizView.question.correctChoiceSatAmount,
          )} BTC.`}
          extraLine={`Approximate USD anchor: ${formatApproxUsd(
            props.quizView.currentItem.approxUsdCents,
          )}.`}
        />

        <div class="quiz-panel__actions">
          <button
            class="primary-button"
            type="button"
            disabled={!props.maybeResult}
            onClick={() => props.onNextQuestion()}
          >
            Next item
          </button>
        </div>
      </div>
    </div>
  );
}
