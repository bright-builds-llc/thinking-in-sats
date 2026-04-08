import { For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";

import { featuredEverydayItems, totalEverydayItemCount } from "../content/items";
import { BuildInfoPanel } from "../components/shared/BuildInfoPanel";
import { LoadingState } from "../components/shared/LoadingState";
import { TimelineSection } from "../components/timeline/TimelineSection";
import {
  centsToUsdString,
  formatBtcAmount,
  formatSatLabel,
  formatUsdPerBitcoin,
} from "../domain/formatting";
import { deriveItemsWithSats, usdCentsToSats } from "../domain/pricing";
import { createMediaQuery } from "../primitives/createMediaQuery";
import type { BuildInfo } from "../services/buildInfo";
import type { QuoteState } from "../domain/quoteCache";

type HomePageProps = {
  quoteState: QuoteState;
  buildInfo: BuildInfo;
};

export function HomePage(props: HomePageProps) {
  const isMobileTimeline = createMediaQuery("(max-width: 70rem)");
  const maybeQuote = createMemo(() => props.quoteState.currentQuote);
  const featuredItemsWithSats = createMemo(() => {
    const quote = maybeQuote();

    if (!quote) {
      return [];
    }

    return deriveItemsWithSats(featuredEverydayItems, quote.usdPerBitcoin);
  });
  const maybeTimelineQuote = createMemo(() => {
    const quote = maybeQuote();

    if (!quote) {
      return null;
    }

    return quote;
  });

  return (
    <div class="page">
      <section class="hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">A sats-first way to think about value</span>
          <h1>Thinking In Sats</h1>
          <p class="lede">
            Train your intuition by mapping everyday purchases onto a single
            logarithmic sats line. Learn the satoshi value first, then reveal
            the approximate dollar anchor only when you want it.
          </p>
          <div class="hero-actions">
            <A class="primary-button" href="/quiz">
              Take the quiz
            </A>
            <a class="secondary-button" href="#timeline">
              Explore the line
            </a>
          </div>
          <div class="hero-stats">
            <span class="stat-chip">{featuredEverydayItems.length} featured anchors</span>
            <span class="stat-chip">{totalEverydayItemCount} everyday items total</span>
          </div>
        </div>
        <div class="quote-panel">
          <Show
            when={maybeQuote()}
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
                <div class="quote-price">
                  {formatUsdPerBitcoin(quote().usdPerBitcoin)}
                </div>
                <div class="quote-meta">
                  <span>
                    1 USD ≈ {formatSatLabel(usdCentsToSats(100, quote().usdPerBitcoin))}
                  </span>
                  <span>
                    Source: {quote().source} · updated{" "}
                    {new Date(quote().fetchedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <Show when={props.quoteState.isStale}>
                    <span>Using a slightly stale cached quote while the live price refreshes.</span>
                  </Show>
                  <Show when={props.quoteState.maybeError}>
                    {(maybeError) => <span>{maybeError()}</span>}
                  </Show>
                </div>
              </>
            )}
          </Show>
        </div>
      </section>

      <section class="timeline-help">
        <article class="surface-card">
          <h2>Why a logarithmic line?</h2>
          <p>
            Value jumps fast as you move from coffee money to rent money. A log
            scale lets tiny and large sat values live on the same vertical
            story without flattening the interesting middle.
          </p>
        </article>
        <article class="surface-card">
          <h2>Why hide the dollars?</h2>
          <p>
            We want a tiny bit of friction. Read sats and BTC first, form an
            intuition, then reveal the approximate USD anchor only when you need
            a familiar reference.
          </p>
        </article>
        <article class="surface-card">
          <h2>How approximate are these prices?</h2>
          <p>
            These are intentionally broad US-centric estimates for everyday life.
            Prices vary by city, season, store, and personal preference, but the
            order of magnitude is the point.
          </p>
        </article>
      </section>

      <section class="surface-card">
        <Show
          when={maybeQuote()}
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
                  {formatSatLabel(
                    usdCentsToSats(500, quote().usdPerBitcoin),
                  )}
                </strong>
              </div>
              <div>
                <span class="eyebrow">A $10 burrito is roughly</span>
                <strong>
                  {formatSatLabel(
                    usdCentsToSats(1000, quote().usdPerBitcoin),
                  )}
                </strong>
              </div>
            </div>
          )}
        </Show>
      </section>

      <section class="surface-card">
        <div class="section-heading">
          <span class="eyebrow">A few quick anchors</span>
          <h2>From tiny spends to monthly bills</h2>
        </div>
        <div class="timeline-help">
          <For each={featuredEverydayItems.slice(0, 6)}>
            {(item) => (
              <article class="surface-card">
                <span class="eyebrow">{item.category}</span>
                <h3>{item.name}</h3>
                <Show when={maybeQuote()}>
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
              </article>
            )}
          </For>
        </div>
      </section>

      <section id="timeline" class="surface-card">
        <div class="section-heading">
          <span class="eyebrow">Main visualization</span>
          <h2>The vertical sats line</h2>
          <p class="quote-meta">
            Scroll from everyday pocket change all the way toward meaningful
            monthly commitments. Every item sits on a true logarithmic position,
            even if the cards slide slightly to stay readable.
          </p>
        </div>
        <Show
          when={maybeTimelineQuote()}
          fallback={
            <LoadingState
              title="Preparing the timeline"
              message="Waiting for the current quote so we can place every item on the sats line."
            />
          }
        >
          {(quote) => (
            <TimelineSection
              items={featuredItemsWithSats()}
              maybeCurrentQuoteLabel={formatUsdPerBitcoin(quote().usdPerBitcoin)}
              maybeSatsPerDollarLabel={formatSatLabel(
                usdCentsToSats(100, quote().usdPerBitcoin),
              )}
              isMobileLayout={isMobileTimeline()}
            />
          )}
        </Show>
      </section>

      <section class="surface-card">
        <div class="section-heading">
          <span class="eyebrow">Method</span>
          <h2>How to read the values</h2>
        </div>
        <ol class="quote-meta">
          <li>
            Start with the item name and its satoshi value.
          </li>
          <li>
            Notice the decade markers: 1 sat, 10 sats, 100 sats, 1k, 10k, 100k,
            and beyond.
          </li>
          <li>
            Use the optional reveal to compare your new sats intuition with the
            approximate USD anchor.
          </li>
        </ol>
      </section>

      <BuildInfoPanel buildInfo={props.buildInfo} />
    </div>
  );
}
