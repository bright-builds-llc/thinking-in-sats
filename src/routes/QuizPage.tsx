import { Show, batch, createMemo, createSignal } from "solid-js";

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
import { deriveItemsWithSats } from "../domain/pricing";
import type { QuoteState } from "../services/quoteStore";
import {
  QuizPageIntro,
  QuizQuestionLayout,
  QuizQuoteFallback,
} from "./QuizPageView";

type QuizPageProps = {
  items: EverydayItem[];
  quoteState: QuoteState;
};

const QUESTION_CARD_SCROLL_GAP_PX = 16;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollQuestionCardIntoView(
  maybeQuizLayoutElement: HTMLDivElement | undefined,
) {
  if (typeof window === "undefined" || !maybeQuizLayoutElement) {
    return;
  }

  const headerHeight =
    document
      .querySelector<HTMLElement>(".site-header")
      ?.getBoundingClientRect().height ?? 0;
  const quizLayoutTop =
    window.scrollY + maybeQuizLayoutElement.getBoundingClientRect().top;
  const targetScrollTop = Math.max(
    quizLayoutTop - headerHeight - QUESTION_CARD_SCROLL_GAP_PX,
    0,
  );

  if (window.scrollY <= targetScrollTop + QUESTION_CARD_SCROLL_GAP_PX) {
    return;
  }

  window.scrollTo({
    top: targetScrollTop,
    behavior: prefersReducedMotion() ? "auto" : "smooth",
  });
}

export function QuizPage(props: QuizPageProps) {
  let maybeQuizLayoutElement: HTMLDivElement | undefined;
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

  const maybeQuizView = createMemo(() => {
    const currentItem = maybeCurrentItem();
    const question = maybeQuestion();

    if (!currentItem || !question) {
      return null;
    }

    return {
      currentItem,
      question,
    };
  });

  const maybeResult = createMemo<QuizQuestionResult | null>(() => {
    const question = maybeQuestion();
    const maybeSelectedChoiceIdValue = maybeSelectedChoiceId();

    if (!question || maybeSelectedChoiceIdValue === null) {
      return null;
    }

    const hasSelectedChoice = question.choices.some(
      (choice) => choice.id === maybeSelectedChoiceIdValue,
    );

    if (!hasSelectedChoice) {
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

    batch(() => {
      setMaybeSelectedChoiceId(null);

      if (currentItem) {
        setMaybePreviousItemId(currentItem.id);
      }

      setQuestionIndex((currentValue) => currentValue + 1);
    });

    queueMicrotask(() => {
      scrollQuestionCardIntoView(maybeQuizLayoutElement);
    });
  };

  const handleQuizLayoutRef = (element: HTMLDivElement) => {
    maybeQuizLayoutElement = element;
  };

  return (
    <section class="page quiz-page">
      <QuizPageIntro />

      <Show
        when={maybeQuizView()}
        keyed
        fallback={<QuizQuoteFallback />}
      >
        {(quizView) => (
          <QuizQuestionLayout
            maybeResult={maybeResult()}
            maybeSelectedChoiceId={maybeSelectedChoiceId()}
            onChoiceSelect={handleChoiceSelect}
            onNextQuestion={handleNextQuestion}
            onQuizLayoutRef={handleQuizLayoutRef}
            questionIndex={questionIndex()}
            quizView={quizView}
          />
        )}
      </Show>
    </section>
  );
}
