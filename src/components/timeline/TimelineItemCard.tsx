import { formatBtcAmount, formatMoneyUsd, formatSats } from "../../domain/formatting";
import type { TimelinePlacement } from "../../domain/itemTypes";
import { UsdRevealPopover } from "./UsdRevealPopover";

type TimelineItemCardProps = {
  placement: TimelinePlacement;
};

export function TimelineItemCard(props: TimelineItemCardProps) {
  const connectorAnchorPercent = () =>
    `${(props.placement.exactPosition - props.placement.displayPosition) * 100 + 50}%`;

  return (
    <article
      class={`timeline-item timeline-item--${props.placement.lane}`}
      style={{
        top: `${props.placement.displayPosition * 100}%`,
        "--connector-anchor": connectorAnchorPercent(),
      }}
    >
      <div class="timeline-item__connector" aria-hidden="true" />
      <div class="timeline-card">
        <div class="timeline-card__header">
          <div>
            <span class="timeline-card__category">
              {props.placement.item.categoryLabel}
            </span>
            <h3 class="timeline-card__title">{props.placement.item.name}</h3>
          </div>
          <span class="timeline-card__marker">
            {formatSats(props.placement.item.satValue)}
          </span>
        </div>
        <p class="timeline-card__description">
          {props.placement.item.description}
        </p>
        <div class="timeline-card__meta">
          <span class="timeline-card__btc">
            {formatBtcAmount(props.placement.item.satValue)}
          </span>
          <UsdRevealPopover
            approxUsdLabel={formatMoneyUsd(props.placement.item.approxUsdCents)}
          />
        </div>
      </div>
    </article>
  );
}
