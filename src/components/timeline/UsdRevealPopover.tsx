import * as Popover from "@kobalte/core/popover";

type UsdRevealPopoverProps = {
  approxUsdLabel: string;
  maybeTriggerText?: string;
  maybeTitle?: string;
  maybeSupportingText?: string;
};

export function UsdRevealPopover(props: UsdRevealPopoverProps) {
  return (
    <Popover.Root gutter={12} placement="bottom">
      <Popover.Trigger class="usd-popover__trigger" type="button">
        {props.maybeTriggerText ?? "Reveal USD"}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content class="usd-popover__content">
          <Popover.Arrow class="popover-arrow" />
          <Popover.Title class="usd-popover__title">
            {props.maybeTitle ?? "Approximate dollar anchor"}
          </Popover.Title>
          <div class="usd-popover__value">{props.approxUsdLabel}</div>
          <Popover.Description class="usd-popover__note">
            {props.maybeSupportingText ??
              "Real-world prices vary by place and time."}
          </Popover.Description>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
