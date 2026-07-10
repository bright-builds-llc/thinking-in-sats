import { Show, batch, createMemo, createSignal, untrack } from "solid-js";

import type {
  EverydayItem,
  EverydayItemWithSats,
  QuizAnswerRecord,
  QuizQuestionResult,
} from "../domain/itemTypes";
import {
  createQuizQuestion,
  createQuizSession,
  evaluateQuizAnswer,
} from "../domain/quiz";
import { deriveItemsWithSats } from "../domain/pricing";
import { shareQuizScore } from "../services/quizShare";
import type { QuoteState } from "../services/quoteStore";
import {
  QuizCompletion,
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
  const [sessionItems, setSessionItems] = createSignal<EverydayItem[]>(
    createQuizSession(untrack(() => props.items)),
  );
  const [questionIndex, setQuestionIndex] = createSignal(0);
  const [answerRecords, setAnswerRecords] = createSignal<QuizAnswerRecord[]>([]);
  const [isComplete, setIsComplete] = createSignal(false);
  const [maybeShareStatus, setMaybeShareStatus] = createSignal<string | null>(
    null,
  );
  const [maybeSelectedChoiceId, setMaybeSelectedChoiceId] = createSignal<
    string | null
  >(null);

  const quizItems = createMemo(() => {
    const maybeQuote = props.quoteState.currentQuote;

    if (!maybeQuote) {
      return [] satisfies EverydayItemWithSats[];
    }

    return deriveItemsWithSats(sessionItems(), maybeQuote.usdPerBitcoin);
  });

  const maybeCurrentItem = createMemo(() => {
    const items = quizItems();

    if (items.length === 0) {
      return null;
    }

    return items[questionIndex()] ?? null;
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

  const correctAnswerCount = createMemo(
    () => answerRecords().filter((answer) => answer.isCorrect).length,
  );

  const handleChoiceSelect = (choiceId: string) => {
    if (maybeResult()) {
      return;
    }

    setMaybeSelectedChoiceId(choiceId);
  };

  const handleNextQuestion = () => {
    const result = maybeResult();
    const currentItem = maybeCurrentItem();

    if (!result || !currentItem) {
      return;
    }

    const hasMoreQuestions = questionIndex() + 1 < quizItems().length;
    const answerRecord: QuizAnswerRecord = {
      ...result,
      item: currentItem,
      questionNumber: questionIndex() + 1,
    };

    batch(() => {
      setAnswerRecords((currentAnswers) => [
        ...currentAnswers,
        answerRecord,
      ]);
      setMaybeSelectedChoiceId(null);
      setMaybeShareStatus(null);

      if (hasMoreQuestions) {
        setQuestionIndex((currentValue) => currentValue + 1);
      } else {
        setIsComplete(true);
      }
    });

    if (hasMoreQuestions) {
      queueMicrotask(() => {
        scrollQuestionCardIntoView(maybeQuizLayoutElement);
      });
    }
  };

  const handleRestart = () => {
    batch(() => {
      setSessionItems(createQuizSession(props.items));
      setQuestionIndex(0);
      setAnswerRecords([]);
      setIsComplete(false);
      setMaybeSelectedChoiceId(null);
      setMaybeShareStatus(null);
    });

    queueMicrotask(() => {
      scrollQuestionCardIntoView(maybeQuizLayoutElement);
    });
  };

  const handleShare = async () => {
    const outcome = await shareQuizScore(
      correctAnswerCount(),
      quizItems().length,
    );

    if (outcome === "shared") {
      setMaybeShareStatus("Score shared. Challenge sent!");
      return;
    }

    if (outcome === "copied") {
      setMaybeShareStatus("Challenge copied to your clipboard.");
      return;
    }

    if (outcome === "unavailable") {
      setMaybeShareStatus(
        "Sharing is unavailable here. You can still copy this page's URL.",
      );
    }
  };

  const handleQuizLayoutRef = (element: HTMLDivElement) => {
    maybeQuizLayoutElement = element;
  };

  return (
    <section class="page quiz-page">
      <QuizPageIntro />

      <Show
        when={!isComplete()}
        fallback={
          <QuizCompletion
            answerRecords={answerRecords()}
            correctAnswers={correctAnswerCount()}
            maybeShareStatus={maybeShareStatus()}
            onRestart={handleRestart}
            onShare={handleShare}
            totalQuestions={quizItems().length}
          />
        }
      >
        <Show
          when={maybeQuizView()}
          keyed
          fallback={<QuizQuoteFallback />}
        >
          {(quizView) => (
            <QuizQuestionLayout
              isLastQuestion={questionIndex() + 1 === quizItems().length}
              maybeResult={maybeResult()}
              maybeSelectedChoiceId={maybeSelectedChoiceId()}
              onChoiceSelect={handleChoiceSelect}
              onNextQuestion={handleNextQuestion}
              onQuizLayoutRef={handleQuizLayoutRef}
              questionIndex={questionIndex()}
              totalQuestions={quizItems().length}
              quizView={quizView}
            />
          )}
        </Show>
      </Show>
    </section>
  );
}
