import { Show, createMemo, createSignal } from "solid-js";

import { QuizCard } from "../components/quiz/QuizCard";
import { QuizChoices } from "../components/quiz/QuizChoices";
import { QuizFeedback } from "../components/quiz/QuizFeedback";
import {
  formatApproxUsd,
  formatBtcValue,
  formatSatLabel,
} from "../domain/formatting";
import type {
  EverydayItem,
  EverydayItemWithSats,
  QuizQuestionResult,
} from "../domain/itemTypes";
import {
  createQuizQuestion,
  evaluateQuizAnswer,
  selectNextQuizItem,
} from "../domain/quiz";
import type { QuoteState } from "../domain/quoteCache";
import { deriveItemsWithSats } from "../domain/pricing";

type QuizPageProps = {
  items: EverydayItem[];
  quoteState: QuoteState;
};

export function QuizPage(props: QuizPageProps) {
  const [questionIndex, setQuestionIndex] = createSignal(0);
  const [maybePreviousItemId, setMaybePreviousItemId] = createSignal<
    string | undefined
  >(undefined);
  const [maybeSelectedChoiceId, setMaybeSelectedChoiceId] = createSignal<
    string | null
  >(null);

  const quizItems = createMemo(() => {
    const maybeQuote = props.quoteState.currentQuote;

    if (!maybeQuote) {
      return [] satisfies EverydayItemWithSats[];
    }

    return deriveItemsWithSats(props.items, maybeQuote.usdPerBitcoin);
  });

  const maybeCurrentItem = createMemo(() => {
    const items = quizItems();

    if (items.length === 0) {
      return null;
    }

    return selectNextQuizItem(
      items,
      questionIndex(),
      maybePreviousItemId(),
    );
  });

  const maybeQuestion = createMemo(() => {
    const currentItem = maybeCurrentItem();

    if (!currentItem) {
      return null;
    }

    return createQuizQuestion(currentItem);
  });

  const maybeResult = createMemo<QuizQuestionResult | null>(() => {
    const question = maybeQuestion();
    const maybeSelectedChoiceIdValue = maybeSelectedChoiceId();

    if (!question || maybeSelectedChoiceIdValue === null) {
      return null;
    }

    return evaluateQuizAnswer(question, maybeSelectedChoiceIdValue);
  });

  const handleChoiceSelect = (choiceId: string) => {
    if (maybeResult()) {
      return;
    }

    setMaybeSelectedChoiceId(choiceId);
  };

  const handleNextQuestion = () => {
    const currentItem = maybeCurrentItem();

    if (currentItem) {
      setMaybePreviousItemId(currentItem.id);
    }

    setQuestionIndex((currentValue) => currentValue + 1);
    setMaybeSelectedChoiceId(null);
  };

  return (
    <section class="page quiz-page">
      <div class="section-heading">
        <span class="eyebrow">Quiz</span>
        <h1>Train your sats intuition</h1>
        <p class="lede">
          Each question uses wide power-of-ten choices so you can focus on
          building rough mental models before you think about dollars.
        </p>
      </div>

      <Show
        when={maybeCurrentItem() && maybeQuestion()}
        fallback={
          <div class="surface-card">
            <p class="lede">
              We need a live BTC/USD quote before we can turn quiz items into
              sats.
            </p>
          </div>
        }
      >
        {(() => {
          const currentItem = maybeCurrentItem() as EverydayItemWithSats;
          const question = maybeQuestion()!;

          return (
            <div class="quiz-layout">
              <QuizCard item={currentItem} />

              <div class="surface-card quiz-panel">
                <div class="quiz-panel__header">
                  <span class="stat-chip">Question #{questionIndex() + 1}</span>
                  <span class="stat-chip">
                    Best guess near {formatSatLabel(question.correctChoiceSatAmount)}
                  </span>
                </div>

                <QuizChoices
                  choices={question.choices}
                  hasAnswered={Boolean(maybeResult())}
                  selectedChoiceId={maybeSelectedChoiceId()}
                  onSelect={handleChoiceSelect}
                />

                    <QuizFeedback
                      isVisible={Boolean(maybeResult())}
                      isCorrect={maybeResult()?.isCorrect ?? false}
                      explanation={`This item lands near ${formatSatLabel(
                        question.correctChoiceSatAmount,
                      )}, or ${formatBtcValue(
                        question.correctChoiceSatAmount,
                      )} BTC.`}
                      extraLine={`Approximate USD anchor: ${formatApproxUsd(
                        currentItem.approxUsdCents,
                      )}.`}
                    />

                <div class="quiz-panel__actions">
                  <button
                    class="primary-button"
                    type="button"
                    disabled={!maybeResult()}
                    onClick={handleNextQuestion}
                  >
                    Next item
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Show>
    </section>
  );
}
