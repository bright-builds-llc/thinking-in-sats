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
  const displayCommit = () => {
    if (props.buildInfo.commit === "Unavailable") {
      return props.buildInfo.commit;
    }

    return props.buildInfo.commit.slice(0, 8);
  };

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
    <section aria-label="Build information" class="build-info-panel">
      <p class="build-info-label">Build provenance</p>

      <dl class="build-info-grid">
        <div>
          <dt>Version</dt>
          <dd>{props.buildInfo.version}</dd>
        </div>
        <div>
          <dt>Commit</dt>
          <dd title={props.buildInfo.commit}>{displayCommit()}</dd>
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
