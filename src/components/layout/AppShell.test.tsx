import { render, screen } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import type { BuildInfo } from "../../services/buildInfo";
import { AppShell } from "./AppShell";

vi.mock("@solidjs/router", () => ({
  A: (props: {
    children?: JSX.Element;
    class?: string;
    href?: string;
  }) => (
    <a class={props.class} href={props.href}>
      {props.children}
    </a>
  ),
}));

const buildInfo: BuildInfo = {
  version: "0.1.0",
  commit: "abcdef1234567890",
  builtAt: "2026-04-08T00:00:00.000Z",
};

describe("AppShell", () => {
  it("renders route content with stable build provenance chrome", () => {
    // Act
    render(() => (
      <AppShell buildInfo={buildInfo}>
        <p>Route content</p>
      </AppShell>
    ));

    // Assert
    expect(screen.getByText("Route content")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Build information" }),
    ).toBeInTheDocument();
    expect(screen.getByText("0.1.0")).toBeInTheDocument();
    expect(screen.getByText("abcdef1234567890")).toBeInTheDocument();
    expect(screen.getByText("2026-04-08T00:00:00.000Z")).toBeInTheDocument();
  });

  it("keeps unavailable build provenance fields visible", () => {
    // Arrange
    const unavailableBuildInfo: BuildInfo = {
      version: "Unavailable",
      commit: "Unavailable",
      builtAt: "Unavailable",
    };

    // Act
    render(() => (
      <AppShell buildInfo={unavailableBuildInfo}>
        <p>Route content</p>
      </AppShell>
    ));

    // Assert
    expect(screen.getAllByText("Unavailable")).toHaveLength(3);
  });
});
