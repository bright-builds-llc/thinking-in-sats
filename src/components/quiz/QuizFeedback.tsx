import { Show } from "solid-js";

type QuizFeedbackProps = {
  isVisible: boolean;
  isCorrect: boolean;
  explanation: string;
  extraLine: string;
};

export function QuizFeedback(props: QuizFeedbackProps) {
  return (
    <Show when={props.isVisible}>
      <section
        class={`quiz-feedback ${
          props.isCorrect ? "quiz-feedback--success" : "quiz-feedback--error"
        }`}
      >
        <h3>{props.isCorrect ? "Nice — that is the right decade." : "Good miss. The scale is the lesson."}</h3>
        <p>{props.explanation}</p>
        <p>{props.extraLine}</p>
      </section>
    </Show>
  );
}
