import type { JSX } from "solid-js";
import { GlobalLightningEasterEgg } from "../effects/GlobalLightningEasterEgg";
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
    <>
      <GlobalLightningEasterEgg />
      <div class="site-shell" data-lightning-gesture-region="background">
        <MysticGridBackdrop class="site-shell__grid" />
        <SiteHeader />
        <main class="site-main" data-lightning-gesture-region="background">
          {props.children}
        </main>
        <SiteFooter buildInfo={props.buildInfo} />
      </div>
    </>
  );
}
