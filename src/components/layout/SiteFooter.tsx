import { A } from "@solidjs/router";

import { BuildInfoPanel } from "../shared/BuildInfoPanel";
import type { BuildInfo } from "../../services/buildInfo";

type SiteFooterProps = {
  buildInfo: BuildInfo;
};

export function SiteFooter(props: SiteFooterProps) {
  return (
    <footer class="site-footer">
      <div class="site-footer__main">
        <div class="site-footer__identity">
          <p class="site-footer__brand">Thinking In Sats</p>
          <div class="site-footer__copy">
            <p>
              Everyday prices are approximate, intentionally rounded, and vary
              by place and time.
            </p>
            <p>
              Learn the satoshi scale first, then compare against dollars when
              you need the anchor.
            </p>
          </div>
        </div>

        <nav aria-label="Footer" class="site-footer__nav">
          <A class="site-footer__link" href="/">
            Line
          </A>
          <A class="site-footer__link" href="/quiz">
            Quiz
          </A>
          <a
            class="site-footer__link"
            href="https://github.com/bright-builds-llc/thinking-in-sats"
            rel="noreferrer"
            target="_blank"
          >
            Source
          </a>
        </nav>
      </div>

      <BuildInfoPanel buildInfo={props.buildInfo} />
    </footer>
  );
}
