import { For, Show } from "solid-js";

import { formatApproxUsd } from "../../domain/formatting";
import type { QuizAnswerRecord } from "../../domain/itemTypes";

type QuizAnswerReportProps = {
  answers: QuizAnswerRecord[];
};

export function QuizAnswerReport(props: QuizAnswerReportProps) {
  const revisitCount = () =>
    props.answers.filter((answer) => !answer.isCorrect).length;
  const reportSummary = () => {
    const count = revisitCount();

    if (count === 0) {
      return "Every answer was correct";
    }

    return `${count} ${count === 1 ? "answer" : "answers"} to revisit`;
  };

  return (
    <Show when={props.answers.length > 0}>
      <details class="surface-card quiz-report">
        <summary class="quiz-report__summary">
          <span class="quiz-report__summary-copy">
            <span class="eyebrow">Answer report</span>
            <strong>Review your answers</strong>
            <span>See what you chose and compare it with the right range.</span>
          </span>
          <span class="quiz-report__summary-meta">{reportSummary()}</span>
        </summary>

        <div class="quiz-report__body">
          <p>
            Missed questions are highlighted so you can focus on the price
            ranges that need another look.
          </p>

          <ol aria-label="Quiz answer report" class="quiz-report__list">
            <For each={props.answers}>
              {(answer) => (
                <li
                  class={`quiz-report__item ${
                    answer.isCorrect
                      ? "quiz-report__item--correct"
                      : "quiz-report__item--incorrect"
                  }`}
                >
                  <article>
                    <div class="quiz-report__item-heading">
                      <div>
                        <span class="quiz-report__question-number">
                          Question {answer.questionNumber}
                        </span>
                        <h3>
                          {answer.questionNumber}. {answer.item.name}
                        </h3>
                      </div>
                      <span class="quiz-report__outcome">
                        {answer.isCorrect ? "Correct" : "Review this one"}
                      </span>
                    </div>

                    <p class="quiz-report__description">
                      {answer.item.description}
                    </p>

                    <div class="quiz-report__answer-grid">
                      <div
                        aria-label={`Your answer: ${answer.selectedChoice.label}`}
                        class="quiz-report__answer quiz-report__answer--selected"
                      >
                        <span>Your answer</span>
                        <strong>{answer.selectedChoice.label}</strong>
                        <small>{answer.selectedChoice.supportingText}</small>
                      </div>
                      <div
                        aria-label={`Correct answer: ${answer.correctChoice.label}`}
                        class="quiz-report__answer quiz-report__answer--correct"
                      >
                        <span>Correct range</span>
                        <strong>{answer.correctChoice.label}</strong>
                        <small>{answer.correctChoice.supportingText}</small>
                      </div>
                    </div>

                    <p class="quiz-report__anchor">
                      Approximate dollar anchor: {formatApproxUsd(
                        answer.item.approxUsdCents,
                      )}
                    </p>
                  </article>
                </li>
              )}
            </For>
          </ol>
        </div>
      </details>
    </Show>
  );
}
