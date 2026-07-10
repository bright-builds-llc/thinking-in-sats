import { For, Show, createMemo } from "solid-js";

import {
  MysticGridBackdrop,
  MysticNumberTicker,
  MysticSurface,
} from "../mystic/MysticVisual";
import { buildTimelineLayout } from "../../domain/timelineLayout";
import type { EverydayItemWithSats } from "../../domain/itemTypes";
import { TimelineItemCard } from "./TimelineItemCard";
import { TimelineScale } from "./TimelineScale";

type TimelineSectionProps = {
  items: EverydayItemWithSats[];
  maybeCurrentQuoteLabel: string;
  maybeSatsPerDollarLabel: string;
  maybeSatsPerDollarValue?: number;
  isMobileLayout?: boolean;
};

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

export function TimelineSection(props: TimelineSectionProps) {
  const layout = createMemo(() =>
    buildTimelineLayout(
      props.items,
      props.isMobileLayout ? "mobile" : "desktop",
    ),
  );
  const readingHelpCopy = createMemo(() =>
    props.isMobileLayout
      ? "On smaller screens the cards switch to a spaced list in sats order so every anchor stays readable."
      : "Positions are logarithmic within each uninterrupted segment. Zigzags compress unusually empty ranges, and cards move within lanes when needed to stay readable.",
  );

  return (
    <section class="timeline-section">
      <div class="timeline-help">
        <MysticSurface as="article" class="surface-card timeline-stat-card">
          <h3>Current BTC anchor</h3>
          <p>{props.maybeCurrentQuoteLabel ?? "Unavailable"}</p>
        </MysticSurface>
        <MysticSurface as="article" class="surface-card timeline-stat-card">
          <h3>1 USD is roughly</h3>
          <p>
            <Show
              when={props.maybeSatsPerDollarValue}
              fallback={props.maybeSatsPerDollarLabel ?? "Unavailable"}
            >
              {(satsPerDollarValue) => (
                <>
                  <MysticNumberTicker
                    accessibleLabel={props.maybeSatsPerDollarLabel}
                    class="timeline-stat-card__number"
                    formattedValue={wholeNumberFormatter.format(
                      satsPerDollarValue(),
                    )}
                    value={satsPerDollarValue()}
                  />{" "}
                  sats
                </>
              )}
            </Show>
          </p>
        </MysticSurface>
        <MysticSurface as="article" class="surface-card timeline-stat-card">
          <h3>Reading the line</h3>
          <p>{readingHelpCopy()}</p>
        </MysticSurface>
      </div>

      <div class={`timeline-panel${props.isMobileLayout ? " timeline-panel--mobile" : ""}`}>
        <MysticGridBackdrop class="timeline-panel__grid" density="dense" />
        <Show
          when={props.isMobileLayout}
          fallback={
            <div class="timeline-scroll-shell">
              <div
                class="timeline-scroll timeline-stage"
                style={{
                  height: `${layout().stageHeightRem}rem`,
                }}
              >
                <div class="timeline-spine" aria-hidden="true" />
                <TimelineScale
                  breaks={layout().breaks}
                  markers={layout().marks}
                />
                <For each={layout().placements}>
                  {(placement) => <TimelineItemCard placement={placement} />}
                </For>
              </div>
            </div>
          }
        >
          <div class="timeline-mobile-list">
            <For each={layout().placements}>
              {(placement) => <TimelineItemCard placement={placement} isMobileList />}
            </For>
          </div>
        </Show>
      </div>
    </section>
  );
}
