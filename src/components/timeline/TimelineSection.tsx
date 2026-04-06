import { For, createMemo } from "solid-js";

import { buildTimelineMarks, buildTimelinePlacements } from "../../domain/timelineLayout";
import type { EverydayItemWithSats } from "../../domain/itemTypes";
import { TimelineItemCard } from "./TimelineItemCard";
import { TimelineScale } from "./TimelineScale";

type TimelineSectionProps = {
  items: EverydayItemWithSats[];
  maybeCurrentQuoteLabel: string;
  maybeSatsPerDollarLabel: string;
  isMobileLayout?: boolean;
};

export function TimelineSection(props: TimelineSectionProps) {
  const placements = createMemo(() =>
    buildTimelinePlacements(props.items, props.isMobileLayout ? "mobile" : "desktop"),
  );
  const marks = createMemo(() => {
    const items = props.items;

    if (items.length === 0) {
      return [];
    }

    return buildTimelineMarks(items[0].satValue, items[items.length - 1].satValue);
  });

  return (
    <section class="timeline-section">
      <div class="timeline-help">
        <article class="surface-card">
          <h3>Current BTC anchor</h3>
          <p>{props.maybeCurrentQuoteLabel ?? "Unavailable"}</p>
        </article>
        <article class="surface-card">
          <h3>1 USD is roughly</h3>
          <p>{props.maybeSatsPerDollarLabel ?? "Unavailable"}</p>
        </article>
        <article class="surface-card">
          <h3>Reading the line</h3>
          <p>
            Each card sits on a logarithmic position, then shifts slightly when needed
            so neighboring labels stay readable.
          </p>
        </article>
      </div>

      <div
        class="timeline-scroll"
        style={{
          "--timeline-decades": `${Math.max(1, marks().length)}`,
        }}
      >
        <div class="timeline-spine" aria-hidden="true" />
        <TimelineScale markers={marks()} />
        <For each={placements()}>
          {(placement) => <TimelineItemCard placement={placement} />}
        </For>
      </div>
    </section>
  );
}
