import { Show } from "solid-js";

import {
  MysticActionButton,
  MysticGradientText,
  MysticSurface,
} from "../components/mystic/MysticVisual";
import { QuizAnswerReport } from "../components/quiz/QuizAnswerReport";
import { QuizCard } from "../components/quiz/QuizCard";
import { QuizChoices } from "../components/quiz/QuizChoices";
import { QuizFeedback } from "../components/quiz/QuizFeedback";
import { QuizLightning } from "../components/quiz/QuizLightning";
import {
  formatApproxUsd,
  formatBtcValue,
  formatSatLabel,
} from "../domain/formatting";
import type {
  EverydayItemWithSats,
  QuizAnswerRecord,
  QuizQuestion,
  QuizQuestionResult,
} from "../domain/itemTypes";

export type QuizView = {
  currentItem: EverydayItemWithSats;
  question: QuizQuestion;
};

type QuizQuestionLayoutProps = {
  isLastQuestion: boolean;
  maybeResult: QuizQuestionResult | null;
  maybeSelectedChoiceId: string | null;
  onChoiceSelect: (choiceId: string) => void;
  onNextQuestion: () => void;
  onQuizLayoutRef: (element: HTMLDivElement) => void;
  questionIndex: number;
  totalQuestions: number;
  quizView: QuizView;
};

type QuizCompletionProps = {
  answerRecords: QuizAnswerRecord[];
  correctAnswers: number;
  maybeShareStatus: string | null;
  onRestart: () => void;
  onShare: () => Promise<void>;
  totalQuestions: number;
};

function buildScoreMessage(correctAnswers: number, totalQuestions: number) {
  const scoreRatio = correctAnswers / Math.max(1, totalQuestions);

  if (scoreRatio === 1) {
    return "Perfect score! Now you're Thinking In Sats!";
  }

  if (scoreRatio >= 0.7) {
    return "Strong result. You are getting a real feel for everyday prices in sats.";
  }

  if (scoreRatio >= 0.4) {
    return "Good progress. A few more rounds will make these price ranges feel familiar.";
  }

  return "Every round helps. Explore a few sats prices, then come back for another set.";
}

export function QuizPageIntro() {
  return (
    <div class="section-heading">
      <span class="eyebrow">Quiz</span>
      <h1>
        Train your <MysticGradientText>sats intuition</MysticGradientText>
      </h1>
    </div>
  );
}

export function QuizQuoteFallback() {
  return (
    <MysticSurface class="surface-card">
      <p class="lede">
        We need a live BTC/USD quote before we can turn quiz items into sats.
      </p>
    </MysticSurface>
  );
}

export function QuizQuestionLayout(props: QuizQuestionLayoutProps) {
  return (
    <div
      class="quiz-layout"
      data-lightning-gesture-region="background"
      ref={props.onQuizLayoutRef}
    >
      <QuizCard item={props.quizView.currentItem} />

      <MysticSurface beam class="surface-card quiz-panel">
        <div class="quiz-panel__header">
          <span class="stat-chip">
            Question {props.questionIndex + 1} of {props.totalQuestions}
          </span>
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
          <MysticActionButton
            class="primary-button"
            type="button"
            disabled={!props.maybeResult}
            onClick={() => props.onNextQuestion()}
          >
            {props.isLastQuestion ? "See my score" : "Next item"}
          </MysticActionButton>
        </div>
      </MysticSurface>
    </div>
  );
}

export function QuizCompletion(props: QuizCompletionProps) {
  const scorePercentage = () =>
    Math.round((props.correctAnswers / Math.max(1, props.totalQuestions)) * 100);

  return (
    <div class="quiz-results" data-lightning-gesture-region="background">
      <MysticSurface
        as="section"
        beam
        class="surface-card quiz-completion"
        intensity="strong"
      >
        <Show when={props.correctAnswers > 8}>
          <QuizLightning />
        </Show>
        <span class="eyebrow">Session complete</span>
        <h2>Quiz complete</h2>

        <div
          aria-label={`${props.correctAnswers} out of ${props.totalQuestions}, ${scorePercentage()} percent correct`}
          class="quiz-completion__score quiz-completion__score--halo"
        >
          <strong>
            {props.correctAnswers} out of {props.totalQuestions}
          </strong>
          <span>{scorePercentage()}% correct</span>
        </div>

        <p class="quiz-completion__message">
          {buildScoreMessage(props.correctAnswers, props.totalQuestions)}
        </p>
        <p class="quiz-completion__challenge">
          Challenge a friend to take a fresh set and see whether they can beat
          your score.
        </p>

        <div class="quiz-completion__actions">
          <button
            class="primary-button"
            onClick={() => void props.onShare()}
            type="button"
          >
            Share my score
          </button>
          <button
            class="secondary-button"
            onClick={() => props.onRestart()}
            type="button"
          >
            Play again
          </button>
        </div>

        <Show when={props.maybeShareStatus}>
          {(shareStatus) => (
            <p class="quiz-completion__status" role="status">
              {shareStatus()}
            </p>
          )}
        </Show>
      </MysticSurface>

      <QuizAnswerReport answers={props.answerRecords} />
    </div>
  );
}
