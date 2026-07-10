import { Show } from "solid-js";

import { MysticSurface } from "../mystic/MysticVisual";
import { formatBtcAmount, formatMoneyUsd, formatSats } from "../../domain/formatting";
import type { TimelinePlacement } from "../../domain/itemTypes";
import { UsdRevealPopover } from "./UsdRevealPopover";

type TimelineItemCardProps = {
  placement: TimelinePlacement;
  isMobileList?: boolean;
};

export function TimelineItemCard(props: TimelineItemCardProps) {
  const cardClassName = () =>
    `timeline-item timeline-item--${props.placement.lane}${props.isMobileList ? " timeline-item--list" : ""}`;
  const connectorGeometry = () => {
    const topPosition = Math.min(
      props.placement.exactPosition,
      props.placement.displayPosition,
    );
    const positionSpan = Math.abs(
      props.placement.exactPosition - props.placement.displayPosition,
    );
    const isFlatConnector = positionSpan < 0.000001;
    const cardY = isFlatConnector
      ? 50
      : props.placement.displayPosition === topPosition
        ? 0
        : 100;
    const anchorY = isFlatConnector ? 50 : cardY === 0 ? 100 : 0;
    const isLeftLane = props.placement.lane === "left";
    const cardX = isLeftLane ? 0 : 100;
    const anchorX = isLeftLane ? 100 : 0;
    const elbowX = isLeftLane ? 88 : 12;

    return {
      height: isFlatConnector ? "2px" : `${positionSpan * 100}%`,
      points: `${cardX},${cardY} ${elbowX},${cardY} ${elbowX},${anchorY} ${anchorX},${anchorY}`,
      top: `${topPosition * 100}%`,
    };
  };
  const maybeStyle = () => {
    if (props.isMobileList) {
      return undefined;
    }

    return {
      top: `${props.placement.displayPosition * 100}%`,
    };
  };

  return (
    <>
      <Show when={!props.isMobileList}>
        <svg
          aria-hidden="true"
          class={`timeline-item__connector timeline-item__connector--${props.placement.lane}`}
          preserveAspectRatio="none"
          style={{
            height: connectorGeometry().height,
            top: connectorGeometry().top,
          }}
          viewBox="0 0 100 100"
        >
          <polyline
            points={connectorGeometry().points}
            vector-effect="non-scaling-stroke"
          />
        </svg>
        <span
          aria-hidden="true"
          class="timeline-item__anchor"
          style={{ top: `${props.placement.exactPosition * 100}%` }}
        />
      </Show>
      <div class={cardClassName()} style={maybeStyle()}>
        <MysticSurface as="article" class="timeline-card">
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
              approxUsdLabel={formatMoneyUsd(
                props.placement.item.approxUsdCents,
              )}
            />
          </div>
        </MysticSurface>
      </div>
    </>
  );
}
