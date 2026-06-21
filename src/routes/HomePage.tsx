import { createMemo } from "solid-js";

import { featuredEverydayItems } from "../content/items";
import type { QuoteState } from "../domain/quoteCache";
import { deriveItemsWithSats } from "../domain/pricing";
import { createMediaQuery } from "../primitives/createMediaQuery";
import {
  HomeHeroSection,
  MethodSection,
  QuickAnchorsSection,
  QuoteReferencePanel,
  QuoteSummarySection,
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

  return (
    <div class="page">
      <section class="hero-grid">
        <HomeHeroSection />
        <QuoteReferencePanel
          isStale={props.quoteState.isStale}
          maybeError={props.quoteState.maybeError}
          maybeQuote={maybeQuote()}
        />
      </section>

      <TimelineExplainerSection />
      <QuoteSummarySection maybeQuote={maybeQuote()} />
      <QuickAnchorsSection maybeQuote={maybeQuote()} />
      <TimelineVisualizationSection
        featuredItemsWithSats={featuredItemsWithSats()}
        isMobileTimeline={isMobileTimeline()}
        maybeQuote={maybeQuote()}
      />
      <MethodSection />
    </div>
  );
}
