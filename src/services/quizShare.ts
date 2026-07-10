export type QuizShareOutcome =
  | "cancelled"
  | "copied"
  | "shared"
  | "unavailable";

type QuizShareOptions = {
  maybeClipboard?: Pick<Clipboard, "writeText">;
  maybeShare?: (data: ShareData) => Promise<void>;
  maybeUrl?: string;
};

function buildQuizUrl(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const url = new URL(window.location.href);
  url.hash = "/quiz";

  return url.toString();
}

function isShareCancellation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export async function shareQuizScore(
  correctAnswers: number,
  totalQuestions: number,
  options: QuizShareOptions = {},
): Promise<QuizShareOutcome> {
  const text = `I scored ${correctAnswers}/${totalQuestions} on the Thinking In Sats quiz. Think you can beat me?`;
  const url = options.maybeUrl ?? buildQuizUrl();
  const maybeShare =
    options.maybeShare ??
    (typeof navigator !== "undefined" && typeof navigator.share === "function"
      ? navigator.share.bind(navigator)
      : undefined);
  const maybeClipboard =
    options.maybeClipboard ??
    (typeof navigator !== "undefined" ? navigator.clipboard : undefined);

  if (maybeShare) {
    try {
      await maybeShare({
        text,
        title: "Thinking In Sats quiz",
        url,
      });

      return "shared";
    } catch (error) {
      if (isShareCancellation(error)) {
        return "cancelled";
      }
    }
  }

  if (!maybeClipboard) {
    return "unavailable";
  }

  try {
    await maybeClipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "unavailable";
  }
}
