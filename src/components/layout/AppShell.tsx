import type { JSX } from "solid-js";
import { MysticGridBackdrop } from "../mystic/MysticVisual";
import type { BuildInfo } from "../../services/buildInfo";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type AppShellProps = {
  buildInfo: BuildInfo;
  children?: JSX.Element;
};

/**
 * Shared site shell across routes.
 */
export function AppShell(props: AppShellProps) {
  return (
    <div class="site-shell">
      <MysticGridBackdrop class="site-shell__grid" />
      <SiteHeader />
      <main class="site-main">{props.children}</main>
      <SiteFooter buildInfo={props.buildInfo} />
    </div>
  );
}
