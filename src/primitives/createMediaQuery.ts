import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";

function readCurrentMatch(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(query).matches;
}

function subscribeToMediaQuery(
  mediaQueryList: MediaQueryList,
  handleChange: (event: MediaQueryListEvent) => void,
): () => void {
  if (typeof mediaQueryList.addEventListener === "function") {
    mediaQueryList.addEventListener("change", handleChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleChange);
    };
  }

  mediaQueryList.addListener(handleChange);

  return () => {
    mediaQueryList.removeListener(handleChange);
  };
}

export function createMediaQuery(query: string): Accessor<boolean> {
  const [matches, setMatches] = createSignal(readCurrentMatch(query));

  onMount(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches);
    const unsubscribe = subscribeToMediaQuery(mediaQueryList, handleChange);

    onCleanup(() => {
      unsubscribe();
    });
  });

  return matches;
}
