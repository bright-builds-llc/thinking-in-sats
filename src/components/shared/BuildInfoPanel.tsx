import type { BuildInfo } from "../../services/buildInfo";

const repositoryUrl = "https://github.com/bright-builds-llc/thinking-in-sats";
const unavailableValue = "Unavailable";

type BuildInfoPanelProps = {
  buildInfo: BuildInfo;
};

export function BuildInfoPanel(props: BuildInfoPanelProps) {
  const isCommitAvailable = () => props.buildInfo.commit !== unavailableValue;
  const displayCommit = () => {
    if (!isCommitAvailable()) {
      return props.buildInfo.commit;
    }

    return props.buildInfo.commit.slice(0, 8);
  };
  const commitUrl = () => `${repositoryUrl}/commit/${props.buildInfo.commit}`;

  return (
    <section aria-label="Build information" class="build-info-panel">
      <dl class="build-info-grid">
        <div>
          <dt>Version</dt>
          <dd>{props.buildInfo.version}</dd>
        </div>
        <div>
          <dt>Commit</dt>
          <dd>
            {isCommitAvailable() ? (
              <a
                aria-label={`Commit ${props.buildInfo.commit} on GitHub`}
                class="build-info-commit-link"
                href={commitUrl()}
                rel="noreferrer"
                target="_blank"
                title={props.buildInfo.commit}
              >
                {displayCommit()}
              </a>
            ) : (
              displayCommit()
            )}
          </dd>
        </div>
        <div>
          <dt>Built</dt>
          <dd>{props.buildInfo.builtAt}</dd>
        </div>
      </dl>
    </section>
  );
}
