import { describe, expect, it, vi } from "vitest";

import { shareQuizScore } from "./quizShare";

describe("shareQuizScore", () => {
  it("shares a score and challenge link through the native share sheet", async () => {
    // Arrange
    const share = vi.fn().mockResolvedValue(undefined);

    // Act
    const outcome = await shareQuizScore(8, 10, {
      maybeShare: share,
      maybeUrl: "https://example.com/#/quiz",
    });

    // Assert
    expect(outcome).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      text: "I scored 8/10 on the Thinking In Sats quiz. Think you can beat me?",
      title: "Thinking In Sats quiz",
      url: "https://example.com/#/quiz",
    });
  });

  it("copies the challenge when native sharing is unavailable", async () => {
    // Arrange
    const writeText = vi.fn().mockResolvedValue(undefined);

    // Act
    const outcome = await shareQuizScore(6, 10, {
      maybeClipboard: { writeText },
      maybeUrl: "https://example.com/#/quiz",
    });

    // Assert
    expect(outcome).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(
      "I scored 6/10 on the Thinking In Sats quiz. Think you can beat me? https://example.com/#/quiz",
    );
  });
});
