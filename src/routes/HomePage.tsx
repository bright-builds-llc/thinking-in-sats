import { createMemo, onMount } from "solid-js";

import { featuredEverydayItems } from "../content/items";
import { deriveItemsWithSats } from "../domain/pricing";
import { createMediaQuery } from "../primitives/createMediaQuery";
import type { QuoteState } from "../services/quoteStore";
import {
  HomeHeroSection,
  QuickAnchorsSection,
  QuoteReferencePanel,
  QuoteSummarySection,
  scrollTimelineIntoView,
  TimelineExplainerSection,
  TimelineVisualizationSection,
} from "./HomePageSections";

type HomePageProps = {
  quoteState: QuoteState;
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

  onMount(() => {
    if (window.location.hash !== "#/#timeline") {
      return;
    }

    scrollTimelineIntoView();
  });

  return (
    <div class="page" data-lightning-gesture-region="background">
      <section class="hero-grid" data-lightning-gesture-region="background">
        <HomeHeroSection />
        <QuoteReferencePanel
          isStale={props.quoteState.isStale}
          maybeError={props.quoteState.maybeError}
          maybeQuote={maybeQuote()}
        />
      </section>

      <QuoteSummarySection maybeQuote={maybeQuote()} />
      <QuickAnchorsSection maybeQuote={maybeQuote()} />
      <TimelineVisualizationSection
        featuredItemsWithSats={featuredItemsWithSats()}
        isMobileTimeline={isMobileTimeline()}
        maybeQuote={maybeQuote()}
      />
      <TimelineExplainerSection />
    </div>
  );
}
