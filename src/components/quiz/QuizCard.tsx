import type { EverydayItemWithSats } from "../../domain/itemTypes";

type QuizCardProps = {
  item: EverydayItemWithSats;
};

export function QuizCard(props: QuizCardProps) {
  return (
    <section class="surface-card quiz-card">
      <span class="eyebrow">Quick sats quiz</span>
      <h2 class="quiz-card__name">{props.item.name}</h2>
      <p class="quiz-card__prompt">
        Which sats value feels closest to this everyday item?
      </p>
      <p class="quiz-card__description">{props.item.description}</p>
      <p class="quiz-card__meta">
        Category: {props.item.categoryLabel}
      </p>
      <p class="quiz-card__meta">
        The choices are intentionally spaced wide so you can think in rough
        orders of magnitude first.
      </p>
    </section>
  );
}
