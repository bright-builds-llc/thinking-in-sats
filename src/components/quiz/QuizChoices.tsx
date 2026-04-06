import { For } from "solid-js";

import type { QuizChoiceView } from "../../domain/itemTypes";

type QuizChoicesProps = {
  choices: QuizChoiceView[];
  hasAnswered: boolean;
  selectedChoiceId: string | null;
  onSelect: (choiceId: string) => void;
};

export function QuizChoices(props: QuizChoicesProps) {
  return (
    <div class="quiz-choices" role="list" aria-label="Quiz answer choices">
      <For each={props.choices}>
        {(choice) => {
          const isSelected = () => props.selectedChoiceId === choice.id;
          const stateClass = () => {
            if (!props.hasAnswered) {
              return "";
            }

            if (choice.isCorrect) {
              return " quiz-choice--correct";
            }

            if (isSelected()) {
              return " quiz-choice--incorrect";
            }

            return "";
          };

          return (
            <button
              type="button"
              class={`quiz-choice${isSelected() ? " quiz-choice--selected" : ""}${stateClass()}`}
              onClick={() => props.onSelect(choice.id)}
              disabled={props.hasAnswered}
            >
              <span class="quiz-choice__label">{choice.label}</span>
              <span class="quiz-choice__hint">{choice.supportingText}</span>
            </button>
          );
        }}
      </For>
    </div>
  );
}
