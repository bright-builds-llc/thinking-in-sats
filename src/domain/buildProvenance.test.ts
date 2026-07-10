import { describe, expect, it } from "vitest";

import { maybeCreateGitHubActionsRunUrl } from "./buildProvenance";

describe("maybeCreateGitHubActionsRunUrl", () => {
  it("creates the exact Actions run URL for a Pages build", () => {
    // Arrange
    const environment = {
      maybePagesBasePath: "/thinking-in-sats/",
      maybeRepository: "bright-builds-llc/thinking-in-sats",
      maybeRunId: "123456789",
      maybeServerUrl: "https://github.com",
    };

    // Act
    const maybeRunUrl = maybeCreateGitHubActionsRunUrl(environment);

    // Assert
    expect(maybeRunUrl).toBe(
      "https://github.com/bright-builds-llc/thinking-in-sats/actions/runs/123456789",
    );
  });

  it("returns no run URL outside a Pages build", () => {
    // Arrange
    const environment = {
      maybePagesBasePath: undefined,
      maybeRepository: "bright-builds-llc/thinking-in-sats",
      maybeRunId: "123456789",
      maybeServerUrl: "https://github.com",
    };

    // Act
    const maybeRunUrl = maybeCreateGitHubActionsRunUrl(environment);

    // Assert
    expect(maybeRunUrl).toBeNull();
  });

  it("returns no run URL for malformed Actions metadata", () => {
    // Arrange
    const environment = {
      maybePagesBasePath: "/thinking-in-sats/",
      maybeRepository: "bright-builds-llc/thinking-in-sats",
      maybeRunId: "not-a-run-id",
      maybeServerUrl: "https://github.com",
    };

    // Act
    const maybeRunUrl = maybeCreateGitHubActionsRunUrl(environment);

    // Assert
    expect(maybeRunUrl).toBeNull();
  });
});
