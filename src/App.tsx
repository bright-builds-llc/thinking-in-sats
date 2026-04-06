import { HashRouter, Route } from "@solidjs/router";
import { createMemo, createSignal, onMount } from "solid-js";

import { AppShell } from "./components/layout/AppShell";
import { HomePage } from "./routes/HomePage";
import { QuizPage } from "./routes/QuizPage";
import { everydayItems } from "./content/items";
import { getBuildInfo } from "./services/buildInfo";
import {
  cleanupQuoteStore,
  getQuoteState,
  initializeQuoteStore,
  subscribeToQuoteState,
} from "./services/quoteStore";

function App() {
  const [quoteState, setQuoteState] = createSignal(getQuoteState());
  const buildInfo = getBuildInfo();

  onMount(() => {
    initializeQuoteStore();
    setQuoteState(getQuoteState());

    const unsubscribe = subscribeToQuoteState((nextState) => {
      setQuoteState(nextState);
    });

    return () => {
      unsubscribe();
      cleanupQuoteStore();
    };
  });

  const currentQuoteState = createMemo(() => quoteState());

  return (
    <HashRouter root={AppShell}>
      <Route
        path="/"
        component={() => (
          <HomePage
            quoteState={currentQuoteState()}
            buildInfo={buildInfo}
          />
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
