import {
  AnimatedGradientText,
  AnimatedGridPattern,
  BentoGrid,
  BorderBeam,
  GridPattern,
  Highlighter,
  NumberTicker,
  RippleButton,
  ShimmerButton,
  ShineBorder,
  TextAnimate,
} from "mystic-ui";
import type { JSX, ParentComponent } from "solid-js";
import { Show, createMemo, mergeProps, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { createMediaQuery } from "../../primitives/createMediaQuery";

type MysticTextElement =
  | "h1"
  | "h2"
  | "h3"
  | "p"
  | "span";

type MysticSurfaceProps = {
  ariaLabel?: string;
  as?: "article" | "div" | "section";
  beam?: boolean;
  class?: string;
  id?: string;
  intensity?: "quiet" | "strong";
};

type MysticGridBackdropProps = {
  class?: string;
  density?: "quiet" | "dense";
};

type MysticNumberTickerProps = {
  accessibleLabel?: string;
  class?: string;
  decimalPlaces?: number;
  formattedValue: string;
  startValue?: number;
  value: number;
};

type MysticTextProps = {
  as?: MysticTextElement;
  by?: "text" | "word" | "character" | "line";
  children: string;
  class?: string;
  delay?: number;
};

type MysticGradientTextProps = {
  children: JSX.Element;
  class?: string;
};

type MysticHighlightProps = {
  children: JSX.Element;
  class?: string;
};

function createPrefersReducedMotion() {
  return createMediaQuery("(prefers-reduced-motion: reduce)");
}

function supportsViewAnimation(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof IntersectionObserver !== "undefined" &&
    typeof ResizeObserver !== "undefined"
  );
}

function mysticAccentColors(intensity: "quiet" | "strong") {
  if (intensity === "strong") {
    return ["#ff9c52", "#ffd3ab", "#ff7d2d"];
  }

  return ["rgba(255, 156, 82, 0.52)", "rgba(255, 211, 171, 0.8)"];
}

export const MysticSurface: ParentComponent<MysticSurfaceProps> = (props) => {
  const localProps = mergeProps(
    { as: "div" as const, intensity: "quiet" as const },
    props,
  );
  const prefersReducedMotion = createPrefersReducedMotion();
  const frameClass = () => `mystic-surface ${localProps.class ?? ""}`;

  return (
    <Show
      when={!prefersReducedMotion()}
      fallback={
        <Dynamic
          aria-label={localProps.ariaLabel}
          class={frameClass()}
          component={localProps.as}
          id={localProps.id}
        >
          {localProps.children}
        </Dynamic>
      }
    >
      <Dynamic
        aria-label={localProps.ariaLabel}
        class="mystic-surface-shell"
        component={localProps.as}
        id={localProps.id}
      >
        <ShineBorder
          borderRadius={8}
          borderWidth={1}
          class={frameClass()}
          color={mysticAccentColors(localProps.intensity)}
          duration={18}
        >
          <Show when={localProps.beam}>
            <BorderBeam
              borderWidth={1}
              colorFrom="#ff9c52"
              colorTo="#ffd3ab"
              duration={16}
              size={180}
            />
          </Show>
          {localProps.children}
        </ShineBorder>
      </Dynamic>
    </Show>
  );
};

export function MysticGridBackdrop(props: MysticGridBackdropProps) {
  const prefersReducedMotion = createPrefersReducedMotion();
  const canAnimate = () => !prefersReducedMotion() && supportsViewAnimation();
  const squareCount = () => (props.density === "dense" ? 38 : 18);

  return (
    <Show
      when={canAnimate()}
      fallback={
        <GridPattern
          aria-hidden="true"
          class={props.class}
          height={56}
          strokeDasharray="4 6"
          width={56}
        />
      }
    >
      <AnimatedGridPattern
        aria-hidden="true"
        class={props.class}
        duration={5}
        height={56}
        maxOpacity={0.22}
        numSquares={squareCount()}
        repeatDelay={1}
        strokeDasharray={6}
        width={56}
      />
    </Show>
  );
}

export function MysticNumberTicker(props: MysticNumberTickerProps) {
  const prefersReducedMotion = createPrefersReducedMotion();
  const label = createMemo(() => props.accessibleLabel ?? props.formattedValue);
  const canAnimate = () => !prefersReducedMotion() && supportsViewAnimation();

  return (
    <Show
      when={canAnimate()}
      fallback={
        <span aria-label={label()} class={props.class}>
          {props.formattedValue}
        </span>
      }
    >
      <NumberTicker
        aria-label={label()}
        class={props.class}
        decimalPlaces={props.decimalPlaces}
        startValue={props.startValue ?? props.value}
        value={props.value}
      />
    </Show>
  );
}

export function MysticText(props: MysticTextProps) {
  const prefersReducedMotion = createPrefersReducedMotion();
  const asElement = () => props.as ?? "span";
  const canAnimate = () => !prefersReducedMotion() && supportsViewAnimation();

  return (
    <Show
      when={canAnimate()}
      fallback={
        <Dynamic component={asElement()} class={props.class}>
          {props.children}
        </Dynamic>
      }
    >
      <TextAnimate
        animation="blurInUp"
        as={asElement()}
        by={props.by ?? "word"}
        class={props.class}
        delay={props.delay ?? 0}
        once
      >
        {props.children}
      </TextAnimate>
    </Show>
  );
}

export const MysticGradientText: ParentComponent<MysticGradientTextProps> = (
  props,
) => {
  const prefersReducedMotion = createPrefersReducedMotion();

  return (
    <Show
      when={!prefersReducedMotion()}
      fallback={<span class={props.class}>{props.children}</span>}
    >
      <AnimatedGradientText
        class={props.class}
        colorFrom="#ffd3ab"
        colorTo="#ff7d2d"
        speed={1.4}
      >
        {props.children}
      </AnimatedGradientText>
    </Show>
  );
};

export const MysticHighlight: ParentComponent<MysticHighlightProps> = (
  props,
) => {
  const prefersReducedMotion = createPrefersReducedMotion();
  const canAnimate = () => !prefersReducedMotion() && supportsViewAnimation();

  return (
    <Show
      when={canAnimate()}
      fallback={<span class={props.class}>{props.children}</span>}
    >
      <Highlighter
        action="underline"
        animationDuration={450}
        class={props.class}
        color="#ffb97c"
        isView
        strokeWidth={2}
      >
        {props.children}
      </Highlighter>
    </Show>
  );
};

export const MysticRippleButton: ParentComponent<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
  const [localProps, forwardProps] = splitProps(props, ["children", "class"]);
  const prefersReducedMotion = createPrefersReducedMotion();

  return (
    <Show
      when={!prefersReducedMotion()}
      fallback={
        <button class={localProps.class} {...forwardProps}>
          {localProps.children}
        </button>
      }
    >
      <RippleButton
        class={localProps.class}
        duration="520ms"
        rippleColor="rgba(255, 211, 171, 0.36)"
        {...forwardProps}
      >
        {localProps.children}
      </RippleButton>
    </Show>
  );
};

export const MysticActionButton: ParentComponent<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>
> = (props) => {
  const [localProps, forwardProps] = splitProps(props, ["children", "class"]);
  const prefersReducedMotion = createPrefersReducedMotion();

  return (
    <Show
      when={!prefersReducedMotion()}
      fallback={
        <button class={localProps.class} {...forwardProps}>
          {localProps.children}
        </button>
      }
    >
      <ShimmerButton
        background="linear-gradient(180deg, #ff9c52, #ff7d2d)"
        class={localProps.class}
        shimmerColor="#fff1dc"
        shimmerDuration="3.4s"
        shimmerSize="0.08em"
        {...forwardProps}
      >
        {localProps.children}
      </ShimmerButton>
    </Show>
  );
};

export { BentoGrid as MysticBentoGrid };
