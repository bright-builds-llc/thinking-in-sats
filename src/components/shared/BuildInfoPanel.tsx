import { createSignal } from "solid-js";

import {
  buildInfoSummary,
  type BuildInfo,
} from "../../services/buildInfo";

type BuildInfoPanelProps = {
  buildInfo: BuildInfo;
};

export function BuildInfoPanel(props: BuildInfoPanelProps) {
  const [copyLabel, setCopyLabel] = createSignal("Copy build summary");

  const handleCopyClick = async () => {
    const summary = buildInfoSummary(props.buildInfo);

    try {
      await navigator.clipboard.writeText(summary);
      setCopyLabel("Copied build summary");
      window.setTimeout(() => setCopyLabel("Copy build summary"), 1_500);
      return;
    } catch {
      setCopyLabel("Copy unavailable");
      window.setTimeout(() => setCopyLabel("Copy build summary"), 1_500);
    }
  };

  return (
    <section class="build-info-panel" aria-label="Build information">
      <div>
        <p class="eyebrow">Build provenance</p>
        <h2>What version are you looking at?</h2>
      </div>

      <dl class="build-info-grid">
        <div>
          <dt>Version</dt>
          <dd>{props.buildInfo.version}</dd>
        </div>
        <div>
          <dt>Commit</dt>
          <dd>{props.buildInfo.commit}</dd>
        </div>
        <div>
          <dt>Built</dt>
          <dd>{props.buildInfo.builtAt}</dd>
        </div>
      </dl>

      <button class="ghost-button" type="button" onClick={handleCopyClick}>
        {copyLabel()}
      </button>
    </section>
  );
}
