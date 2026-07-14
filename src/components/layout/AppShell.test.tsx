import { render, screen, waitFor, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { splitProps, type JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import type { BuildInfo } from "../../services/buildInfo";
import { AppShell } from "./AppShell";

vi.mock("@solidjs/router", () => ({
  A: (
    props: JSX.AnchorHTMLAttributes<HTMLAnchorElement> & {
      activeClass?: string;
      end?: boolean;
      inactiveClass?: string;
      children?: JSX.Element;
    },
  ) => {
    const [, anchorProps] = splitProps(props, [
      "activeClass",
      "end",
      "inactiveClass",
    ]);

    return <a {...anchorProps}>{props.children}</a>;
  },
  useLocation: () => ({ pathname: "/" }),
}));

const buildInfo: BuildInfo = {
  version: "0.1.0",
  commit: "abcdef1234567890",
  builtAt: "2026-04-08T00:00:00.000Z",
  maybeBuildRunUrl:
    "https://github.com/bright-builds-llc/thinking-in-sats/actions/runs/123456789",
};

describe("AppShell", () => {
  it("hides primary route links behind the header menu", async () => {
    // Arrange
    const user = userEvent.setup();
    window.scrollTo = vi.fn();

    // Act
    render(() => (
      <AppShell buildInfo={buildInfo}>
        <p>Route content</p>
      </AppShell>
    ));

    // Assert
    const header = screen.getByRole("banner");
    expect(
      within(header).getByRole("link", { name: "Thinking In Sats" }),
    ).toHaveAttribute("href", "/");
    expect(
      within(header).queryByRole("link", { name: "Line" }),
    ).not.toBeInTheDocument();
    expect(
      within(header).queryByRole("link", { name: "Quiz" }),
    ).not.toBeInTheDocument();

    await user.click(within(header).getByRole("button", { name: "Menu" }));

    const menu = await screen.findByRole("menu");
    const lineItem = within(menu).getByRole("menuitem", { name: "Line" });
    expect(lineItem).toHaveAttribute("href", "/#timeline");
    expect(lineItem).toHaveAttribute("aria-current", "page");
    expect(lineItem).toHaveClass("site-menu-item--active");
    expect(within(menu).getByRole("menuitem", { name: "Quiz" })).toHaveAttribute(
      "href",
      "/quiz",
    );

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(within(header).getByRole("button", { name: "Menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
    expect(menu).toHaveAttribute("data-closed");
  });

  it("renders route content with standard footer and quiet build information", () => {
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
    expect(
      within(buildRegion).queryByText("Build provenance"),
    ).not.toBeInTheDocument();
    expect(within(buildRegion).getByText("0.1.0")).toBeInTheDocument();
    const commitLink = within(buildRegion).getByRole("link", {
      name: "Commit abcdef1234567890 on GitHub",
    });
    expect(commitLink).toHaveTextContent("abcdef12");
    expect(commitLink).toHaveAttribute(
      "href",
      "https://github.com/bright-builds-llc/thinking-in-sats/commit/abcdef1234567890",
    );
    expect(commitLink).toHaveAttribute(
      "title",
      "abcdef1234567890",
    );
    const builtLink = within(buildRegion).getByRole("link", {
      name: "Build from 2026-04-08T00:00:00.000Z on GitHub Actions",
    });
    expect(builtLink).toHaveTextContent("2026-04-08T00:00:00.000Z");
    expect(builtLink).toHaveAttribute(
      "href",
      "https://github.com/bright-builds-llc/thinking-in-sats/actions/runs/123456789",
    );
    expect(builtLink).toHaveAttribute("target", "_blank");
    expect(
      within(buildRegion).queryByRole("button", {
        name: "Copy build summary",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps the build timestamp plain outside a GitHub Pages build", () => {
    // Arrange
    const localBuildInfo: BuildInfo = {
      ...buildInfo,
      maybeBuildRunUrl: null,
    };

    // Act
    render(() => (
      <AppShell buildInfo={localBuildInfo}>
        <p>Route content</p>
      </AppShell>
    ));

    // Assert
    const buildRegion = screen.getByRole("region", {
      name: "Build information",
    });
    const builtTimestamp = within(buildRegion).getByText(
      "2026-04-08T00:00:00.000Z",
    );
    expect(builtTimestamp.closest("a")).toBeNull();
  });

  it("keeps unavailable build provenance fields visible", () => {
    // Arrange
    const unavailableBuildInfo: BuildInfo = {
      version: "Unavailable",
      commit: "Unavailable",
      builtAt: "Unavailable",
      maybeBuildRunUrl: null,
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
    expect(within(buildRegion).queryByRole("link")).not.toBeInTheDocument();
  });
});
