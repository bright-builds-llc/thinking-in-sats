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
            <svg viewBox="0 0 24 18">
              <polyline
                points="12,0 6,5 18,9 6,13 12,18"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </span>
        )}
      </For>
    </div>
  );
}
