import * as Popover from "@kobalte/core/popover";
import { createSignal, onCleanup } from "solid-js";

import { createMediaQuery } from "../../primitives/createMediaQuery";

const usdPopoverCloseAnimationMs = 120;

type UsdRevealPopoverProps = {
  approxUsdLabel: string;
  maybeTriggerText?: string;
  maybeTitle?: string;
  maybeSupportingText?: string;
};

export function UsdRevealPopover(props: UsdRevealPopoverProps) {
  const reduceMotion = createMediaQuery("(prefers-reduced-motion: reduce)");
  const [isOpen, setIsOpen] = createSignal(false);
  const [forceMountDuringClose, setForceMountDuringClose] =
    createSignal(false);
  let maybeCloseTimer: ReturnType<typeof setTimeout> | undefined;

  const clearCloseTimer = () => {
    if (maybeCloseTimer === undefined) {
      return;
    }

    clearTimeout(maybeCloseTimer);
    maybeCloseTimer = undefined;
  };

  const handleOpenChange = (nextIsOpen: boolean) => {
    clearCloseTimer();

    if (nextIsOpen) {
      setIsOpen(true);
      setForceMountDuringClose(false);
      return;
    }

    if (reduceMotion()) {
      setIsOpen(false);
      setForceMountDuringClose(false);
      return;
    }

    setForceMountDuringClose(true);
    setIsOpen(false);
    maybeCloseTimer = setTimeout(() => {
      setForceMountDuringClose(false);
      maybeCloseTimer = undefined;
    }, usdPopoverCloseAnimationMs);
  };

  onCleanup(() => {
    clearCloseTimer();
  });

  return (
    <Popover.Root
      forceMount={forceMountDuringClose()}
      gutter={12}
      onOpenChange={handleOpenChange}
      open={isOpen()}
      placement="bottom"
    >
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
