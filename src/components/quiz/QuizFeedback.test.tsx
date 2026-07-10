import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import { QuizFeedback } from "./QuizFeedback";

describe("QuizFeedback", () => {
  it("describes a correct answer as the right price range", () => {
    // Arrange
    const props = {
      explanation: "Coffee is in this range.",
      extraLine: "Keep going.",
      isCorrect: true,
      isVisible: true,
    };

    // Act
    const { getByRole } = render(() => <QuizFeedback {...props} />);

    // Assert
    expect(
      getByRole("heading", {
        level: 3,
        name: "Nice — that is the right price range.",
      }),
    ).toBeInTheDocument();
  });
});
