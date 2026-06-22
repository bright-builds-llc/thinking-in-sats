import { HashRouter, Route } from "@solidjs/router";
import { render, screen, waitFor, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./SiteHeader";

function HeaderRouterShell(props: { children?: JSX.Element }) {
  return (
    <>
      <SiteHeader />
      <main>{props.children}</main>
    </>
  );
}

function renderHeaderRoutes() {
  return render(() => (
    <HashRouter root={HeaderRouterShell}>
      <Route path="/" component={() => <h1>Line route</h1>} />
      <Route path="/quiz" component={() => <h1>Quiz route</h1>} />
    </HashRouter>
  ));
}

describe("SiteHeader", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "#/quiz");
    window.scrollTo = vi.fn();
  });

  it("navigates from the quiz route to the line route through the header menu", async () => {
    // Arrange
    const user = userEvent.setup();
    renderHeaderRoutes();

    // Act
    expect(
      await screen.findByRole("heading", { name: "Quiz route" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Menu" }));

    const menu = await screen.findByRole("menu");
    const lineItem = within(menu).getByRole("menuitem", { name: "Line" });

    // Assert
    expect(lineItem).toHaveAttribute("href", "#/");

    // Act
    await user.click(lineItem);

    // Assert
    await waitFor(() => {
      expect(window.location.hash).toBe("#/");
    });
    expect(
      await screen.findByRole("heading", { name: "Line route" }),
    ).toBeInTheDocument();
  });
});
