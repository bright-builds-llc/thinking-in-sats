export type BuildInfo = {
  version: string;
  commit: string;
  builtAt: string;
  maybeBuildRunUrl: string | null;
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
    maybeBuildRunUrl: maybeReadBuildEnv("VITE_BUILD_RUN_URL") ?? null,
  };
}

export const buildInfo = getBuildInfo();
