import { For, Show } from "solid-js";
import { A } from "@solidjs/router";

import {
  MysticBentoGrid,
  MysticGradientText,
  MysticHighlight,
  MysticNumberTicker,
  MysticSurface,
} from "../components/mystic/MysticVisual";
import { LoadingState } from "../components/shared/LoadingState";
import { TimelineSection } from "../components/timeline/TimelineSection";
import { featuredEverydayItems } from "../content/items";
import {
  centsToUsdString,
  formatBtcAmount,
  formatSatLabel,
  formatUsdPerBitcoin,
} from "../domain/formatting";
import type { EverydayItemWithSats } from "../domain/itemTypes";
import { usdCentsToSats } from "../domain/pricing";
import type { PriceQuote } from "../services/quoteStore";

type QuoteAwareSectionProps = {
  maybeQuote: PriceQuote | null;
};

type QuoteReferencePanelProps = QuoteAwareSectionProps & {
  isStale: boolean;
  maybeError: string | null;
};

type TimelineVisualizationProps = QuoteAwareSectionProps & {
  featuredItemsWithSats: EverydayItemWithSats[];
  isMobileTimeline: boolean;
};

const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatTickerNumber(value: number): string {
  return wholeNumberFormatter.format(Math.round(value));
}

export function scrollTimelineIntoView() {
  const maybeTimeline = document.getElementById("timeline");

  if (!maybeTimeline) {
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  maybeTimeline.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

export function HomeHeroSection() {
  return (
    <MysticSurface beam class="hero-panel hero-copy" intensity="strong">
      <span class="eyebrow">A sats-first way to think about value</span>
      <h1>
        <MysticGradientText>Thinking In Sats</MysticGradientText>
      </h1>
      <p class="lede">
        Learn to think in sats by seeing how much familiar everyday purchases
        cost, below. Then take a quiz to test your intuition.
      </p>
      <div class="hero-actions">
        <A class="primary-button" href="/quiz">
          Take the quiz
        </A>
        <button
          aria-controls="timeline"
          class="secondary-button"
          onClick={scrollTimelineIntoView}
          type="button"
        >
          Explore prices in sats
        </button>
      </div>
    </MysticSurface>
  );
}

export function QuoteReferencePanel(props: QuoteReferencePanelProps) {
  return (
    <MysticSurface beam class="quote-panel" intensity="strong">
      <Show
        when={props.maybeQuote}
        fallback={
          <LoadingState
            title="Loading live sats context"
            message="Fetching a current BTC/USD anchor before we reveal the line."
          />
        }
      >
        {(quote) => (
          <>
            <h2>Live reference</h2>
            <div
              aria-label={formatUsdPerBitcoin(quote().usdPerBitcoin)}
              class="quote-price"
            >
              <span aria-hidden="true">$</span>
              <MysticNumberTicker
                accessibleLabel={formatUsdPerBitcoin(quote().usdPerBitcoin)}
                class="quote-price__ticker"
                formattedValue={formatTickerNumber(quote().usdPerBitcoin)}
                value={quote().usdPerBitcoin}
              />
              <span class="quote-price__suffix" aria-hidden="true">
                / BTC
              </span>
            </div>
            <div class="quote-meta">
              <span>
                1 USD ≈ {formatSatLabel(usdCentsToSats(100, quote().usdPerBitcoin))}
              </span>
              <span>
                Source: {quote().sourceLabel} · updated{" "}
                {new Date(quote().fetchedAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <Show when={props.isStale}>
                <span>Using a slightly stale cached quote while the live price refreshes.</span>
              </Show>
              <Show when={props.maybeError}>
                {(maybeError) => <span>{maybeError()}</span>}
              </Show>
            </div>
          </>
        )}
      </Show>
    </MysticSurface>
  );
}

export function TimelineExplainerSection() {
  return (
    <MysticBentoGrid class="timeline-help mystic-bento mystic-bento--compact">
      <MysticSurface as="article" class="surface-card explainer-card">
        <h2>Why a logarithmic line?</h2>
        <p>
          Value jumps fast as you move from coffee money to rent money. A log
          scale lets tiny and large sat values live on the same vertical story
          without flattening the interesting middle.
        </p>
      </MysticSurface>
      <MysticSurface as="article" class="surface-card explainer-card">
        <h2>Why hide the dollars?</h2>
        <p>
          We want a tiny bit of friction. Read sats and BTC first, form an
          intuition, then reveal the{" "}
          <MysticHighlight>approximate USD anchor</MysticHighlight> only when
          you need a familiar reference.
        </p>
      </MysticSurface>
      <MysticSurface as="article" class="surface-card explainer-card">
        <h2>How approximate are these prices?</h2>
        <p>
          These are intentionally broad US-centric estimates for everyday life.
          Prices vary by city, season, store, and personal preference, but the
          order of magnitude is the point.
        </p>
      </MysticSurface>
    </MysticBentoGrid>
  );
}

export function QuoteSummarySection(props: QuoteAwareSectionProps) {
  return (
    <MysticSurface as="section" class="surface-card quote-summary-card">
      <Show
        when={props.maybeQuote}
        fallback={
          <p class="quote-meta">
            If the live quote is unavailable, we will fall back to the freshest
            cached price we have.
          </p>
        }
      >
        {(quote) => (
          <div class="hero-stats">
            <div>
              <span class="eyebrow">Current BTC/USD anchor</span>
              <strong>{formatUsdPerBitcoin(quote().usdPerBitcoin)}</strong>
            </div>
            <div>
              <span class="eyebrow">A $5 coffee is roughly</span>
              <strong>
                {formatSatLabel(usdCentsToSats(500, quote().usdPerBitcoin))}
              </strong>
            </div>
            <div>
              <span class="eyebrow">A $10 burrito is roughly</span>
              <strong>
                {formatSatLabel(usdCentsToSats(1000, quote().usdPerBitcoin))}
              </strong>
            </div>
          </div>
        )}
      </Show>
    </MysticSurface>
  );
}

export function QuickAnchorsSection(props: QuoteAwareSectionProps) {
  return (
    <MysticSurface as="section" class="surface-card anchors-section" beam>
      <div class="section-heading">
        <span class="eyebrow">A few quick anchors</span>
        <h2>
          From <MysticHighlight>tiny spends</MysticHighlight> to monthly bills
        </h2>
      </div>
      <MysticBentoGrid class="timeline-help mystic-bento anchor-grid">
        <For each={featuredEverydayItems.slice(0, 6)}>
          {(item) => (
            <MysticSurface as="article" class="surface-card anchor-card">
              <span class="eyebrow">{item.category}</span>
              <h3>{item.name}</h3>
              <Show when={props.maybeQuote}>
                {(quote) => {
                  const sats = usdCentsToSats(
                    item.approxUsdCents,
                    quote().usdPerBitcoin,
                  );

                  return (
                    <>
                      <strong>{formatSatLabel(sats)}</strong>
                      <p>{formatBtcAmount(sats)}</p>
                    </>
                  );
                }}
              </Show>
              <p class="quote-meta">
                Approx. {centsToUsdString(item.approxUsdCents)}
              </p>
            </MysticSurface>
          )}
        </For>
      </MysticBentoGrid>
    </MysticSurface>
  );
}

export function TimelineVisualizationSection(props: TimelineVisualizationProps) {
  return (
    <MysticSurface
      as="section"
      beam
      class="surface-card timeline-visual-card"
      id="timeline"
    >
      <div class="section-heading">
        <h2>
          The <MysticGradientText>vertical sats line</MysticGradientText>
        </h2>
        <p class="quote-meta">
          Scroll from everyday pocket change all the way toward meaningful
          monthly commitments. Positions are logarithmic within uninterrupted
          segments; zigzags compress unusually empty ranges.
        </p>
      </div>
      <Show
        when={props.maybeQuote}
        fallback={
          <LoadingState
            title="Preparing the timeline"
            message="Waiting for the current quote so we can place every item on the sats line."
          />
        }
      >
        {(quote) => (
          <TimelineSection
            items={props.featuredItemsWithSats}
            maybeCurrentQuoteLabel={formatUsdPerBitcoin(quote().usdPerBitcoin)}
            maybeSatsPerDollarLabel={formatSatLabel(
              usdCentsToSats(100, quote().usdPerBitcoin),
            )}
            maybeSatsPerDollarValue={usdCentsToSats(100, quote().usdPerBitcoin)}
            isMobileLayout={props.isMobileTimeline}
          />
        )}
      </Show>
    </MysticSurface>
  );
}
