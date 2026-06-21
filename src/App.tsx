import { HashRouter, Route } from "@solidjs/router";
import { createMemo, createSignal, onMount } from "solid-js";
import type { JSX } from "solid-js";

import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./routes/HomePage";
import { QuizPage } from "./routes/QuizPage";
import { everydayItems } from "./content/items";
import { getBuildInfo } from "./services/buildInfo";
import { liveQuoteStore } from "./services/quoteStore";

function App() {
  const [quoteState, setQuoteState] = createSignal(
    liveQuoteStore.getSnapshot(),
  );
  const buildInfo = getBuildInfo();
  const AppRoot = (props: { children?: JSX.Element }) => (
    <AppShell buildInfo={buildInfo}>{props.children}</AppShell>
  );

  onMount(() => {
    liveQuoteStore.start();
    setQuoteState(liveQuoteStore.getSnapshot());

    const unsubscribe = liveQuoteStore.subscribe((nextState) => {
      setQuoteState(nextState);
    });

    return () => {
      unsubscribe();
      liveQuoteStore.stop();
    };
  });

  const currentQuoteState = createMemo(() => quoteState());

  return (
    <HashRouter root={AppRoot}>
      <Route
        path="/"
        component={() => (
          <HomePage quoteState={currentQuoteState()} />
        )}
      />
      <Route
        path="/quiz"
        component={() => (
          <QuizPage
            items={everydayItems}
            quoteState={currentQuoteState()}
          />
        )}
      />
    </HashRouter>
  );
}

export default App;
