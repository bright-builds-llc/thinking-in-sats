import { For } from "solid-js";

import type { TimelineMark } from "../../domain/itemTypes";

type TimelineScaleProps = {
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
    </div>
  );
}
