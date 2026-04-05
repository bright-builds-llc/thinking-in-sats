import type { JSX } from "solid-js";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type AppShellProps = {
  children?: JSX.Element;
};

/**
 * Shared site shell across routes.
 */
export function AppShell(props: AppShellProps) {
  return (
    <div class="app-shell">
      <SiteHeader />
      <main class="app-main">{props.children}</main>
      <SiteFooter />
    </div>
  );
}
