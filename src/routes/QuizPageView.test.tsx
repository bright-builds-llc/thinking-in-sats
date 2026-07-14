import { render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QuizCompletion, QuizPageIntro } from "./QuizPageView";
import "../styles/global.css";

const completionProps = {
  answerRecords: [],
  maybeShareStatus: null,
  onRestart: vi.fn(),
  onScoreRef: vi.fn(),
  onShare: vi.fn().mockResolvedValue(undefined),
  totalQuestions: 10,
};

describe("QuizPageIntro", () => {
  it("keeps the introduction focused on the quiz heading", () => {
    // Act
    const { getByRole, queryByText } = render(() => <QuizPageIntro />);

    // Assert
    expect(
      getByRole("heading", { level: 1, name: "Train your sats intuition" }),
    ).toBeInTheDocument();
    expect(
      queryByText(/Each 10-question round uses wide power-of-ten choices/i),
    ).not.toBeInTheDocument();
  });
});

describe("QuizCompletion", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("renders an animated halo around the score", () => {
    // Act
    const { container } = render(() => (
      <QuizCompletion {...completionProps} correctAnswers={6} />
    ));

    // Assert
    expect(
      container.querySelector(".quiz-completion__score--halo"),
    ).toBeInTheDocument();
  });

  it("renders procedural lightning only above eight correct answers", () => {
    // Act
    const eightCorrect = render(() => (
      <QuizCompletion {...completionProps} correctAnswers={8} />
    ));
    const nineCorrect = render(() => (
      <QuizCompletion {...completionProps} correctAnswers={9} />
    ));

    // Assert
    expect(
      eightCorrect.container.querySelector(".quiz-completion__lightning"),
    ).not.toBeInTheDocument();
    expect(
      nineCorrect.container.querySelector(".quiz-completion__lightning"),
    ).toBeInTheDocument();
  });

  it("layers high-score lightning above the centered score", () => {
    // Arrange
    const { container } = render(() => (
      <QuizCompletion {...completionProps} correctAnswers={9} />
    ));
    const maybeLightning = container.querySelector<HTMLElement>(
      ".quiz-completion__lightning",
    );
    const maybeScore = container.querySelector<HTMLElement>(
      ".quiz-completion__score",
    );

    if (!maybeLightning || !maybeScore) {
      throw new Error("Expected high-score lightning and score elements.");
    }

    // Act
    const lightningZIndex = Number(getComputedStyle(maybeLightning).zIndex);
    const scoreZIndex = Number(getComputedStyle(maybeScore).zIndex);

    // Assert
    expect(lightningZIndex).toBeGreaterThan(scoreZIndex);
  });

  it("uses the Thinking In Sats message for a perfect score", () => {
    // Act
    const { getByText } = render(() => (
      <QuizCompletion {...completionProps} correctAnswers={10} />
    ));

    // Assert
    expect(
      getByText("Perfect score! Now you're Thinking In Sats!"),
    ).toBeInTheDocument();
  });

  it("disables the lightning animation when reduced motion is preferred", () => {
    // Arrange
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        addEventListener: vi.fn(),
        matches: true,
        removeEventListener: vi.fn(),
      }),
    });

    // Act
    const { container } = render(() => (
      <QuizCompletion {...completionProps} correctAnswers={9} />
    ));

    // Assert
    expect(container.querySelector(".quiz-completion__lightning")).toHaveAttribute(
      "data-animation-active",
      "false",
    );
  });
});
