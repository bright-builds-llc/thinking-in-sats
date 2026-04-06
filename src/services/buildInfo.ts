export type BuildInfo = {
  version: string;
  commit: string;
  builtAt: string;
};

function maybeReadBuildEnv(name: string): string | undefined {
  const maybeValue = import.meta.env[name];

  if (typeof maybeValue !== "string") {
    return undefined;
  }

  const normalizedValue = maybeValue.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  return normalizedValue;
}

export function getBuildInfo(): BuildInfo {
  return {
    version: maybeReadBuildEnv("VITE_APP_VERSION") ?? "Unavailable",
    commit: maybeReadBuildEnv("VITE_GIT_COMMIT") ?? "Unavailable",
    builtAt: maybeReadBuildEnv("VITE_BUILD_TIMESTAMP") ?? "Unavailable",
  };
}

export function buildInfoSummary(buildInfo: BuildInfo): string {
  return [
    `Version: ${buildInfo.version}`,
    `Commit: ${buildInfo.commit}`,
    `Built at: ${buildInfo.builtAt}`,
  ].join("\n");
}

export const buildInfo = getBuildInfo();
