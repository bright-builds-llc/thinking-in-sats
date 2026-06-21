import { BuildInfoPanel } from "../shared/BuildInfoPanel";
import type { BuildInfo } from "../../services/buildInfo";

type SiteFooterProps = {
  buildInfo: BuildInfo;
};

export function SiteFooter(props: SiteFooterProps) {
  return (
    <footer class="site-footer">
      <div class="site-footer__copy">
        <p>
          Everyday prices are approximate, intentionally rounded, and vary by
          place and time.
        </p>
        <p>
          The goal is intuition first: learn the satoshi scale before peeking at
          dollars.
        </p>
      </div>

      <BuildInfoPanel buildInfo={props.buildInfo} />
    </footer>
  );
}
