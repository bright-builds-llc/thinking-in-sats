import { render, screen, within } from "@solidjs/testing-library";
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
  it("renders route content with standard footer and quiet build provenance", () => {
    // Act
    render(() => (
      <AppShell buildInfo={buildInfo}>
        <p>Route content</p>
      </AppShell>
    ));

    // Assert
    expect(screen.getByText("Route content")).toBeInTheDocument();
    const footer = screen.getByRole("contentinfo");
    const footerNav = within(footer).getByRole("navigation", {
      name: "Footer",
    });
    expect(within(footer).getByText("Thinking In Sats")).toBeInTheDocument();
    expect(
      within(footer).getByText(/Everyday prices are approximate/),
    ).toBeInTheDocument();
    expect(
      within(footerNav).getByRole("link", { name: "Line" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(footerNav).getByRole("link", { name: "Quiz" }),
    ).toHaveAttribute("href", "/quiz");
    expect(
      within(footerNav).getByRole("link", { name: "Source" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/bright-builds-llc/thinking-in-sats",
    );

    const buildRegion = within(footer).getByRole("region", {
      name: "Build information",
    });
    expect(within(buildRegion).getByText("Build provenance")).toBeInTheDocument();
    expect(within(buildRegion).getByText("0.1.0")).toBeInTheDocument();
    expect(within(buildRegion).getByText("abcdef12")).toHaveAttribute(
      "title",
      "abcdef1234567890",
    );
    expect(
      within(buildRegion).getByText("2026-04-08T00:00:00.000Z"),
    ).toBeInTheDocument();
    expect(
      within(buildRegion).getByRole("button", {
        name: "Copy build summary",
      }),
    ).toBeInTheDocument();
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
    const buildRegion = screen.getByRole("region", {
      name: "Build information",
    });
    expect(within(buildRegion).getAllByText("Unavailable")).toHaveLength(3);
  });
});
