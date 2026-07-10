import { For } from "solid-js";

import type { TimelineMark } from "../../domain/itemTypes";
import type { TimelineBreak } from "../../domain/timelineLayout";

type TimelineScaleProps = {
  breaks: TimelineBreak[];
  markers: TimelineMark[];
};

export function TimelineScale(props: TimelineScaleProps) {
  return (
    <div class="timeline-scale" aria-hidden="true">
      <For each={props.markers}>
        {(marker) => (
          <div
            class="timeline-scale__tick"
            style={{ top: `${marker.position * 100}%` }}
          >
            <span class="timeline-scale__label">{marker.label}</span>
          </div>
        )}
      </For>
      <For each={props.breaks}>
        {(timelineBreak) => (
          <span
            class="timeline-scale__break"
            data-maximum-sats={timelineBreak.maximumSats}
            data-minimum-sats={timelineBreak.minimumSats}
            style={{
              top: `${((timelineBreak.startPosition + timelineBreak.endPosition) / 2) * 100}%`,
            }}
          >
            <svg viewBox="0 0 24 24">
              <path d="M14.4 1 4.8 13.2h6.1L8.6 23 19.2 9.5h-6.1L14.4 1Z" />
            </svg>
          </span>
        )}
      </For>
    </div>
  );
}
