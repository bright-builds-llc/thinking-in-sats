type GitHubPagesBuildEnvironment = {
  maybePagesBasePath: string | undefined;
  maybeRepository: string | undefined;
  maybeRunId: string | undefined;
  maybeServerUrl: string | undefined;
};

function maybeNormalizeEnvironmentValue(value: string | undefined): string | null {
  const maybeValue = value?.trim();

  return maybeValue ? maybeValue : null;
}

export function maybeCreateGitHubActionsRunUrl(
  environment: GitHubPagesBuildEnvironment,
): string | null {
  const maybePagesBasePath = maybeNormalizeEnvironmentValue(
    environment.maybePagesBasePath,
  );
  const maybeRepository = maybeNormalizeEnvironmentValue(
    environment.maybeRepository,
  );
  const maybeRunId = maybeNormalizeEnvironmentValue(environment.maybeRunId);
  const maybeServerUrl = maybeNormalizeEnvironmentValue(
    environment.maybeServerUrl,
  );

  if (
    !maybePagesBasePath ||
    !maybeRepository ||
    !maybeRunId ||
    !maybeServerUrl
  ) {
    return null;
  }

  const repositoryParts = maybeRepository.split("/");

  if (repositoryParts.length !== 2 || !/^\d+$/.test(maybeRunId)) {
    return null;
  }

  try {
    const serverUrl = new URL(maybeServerUrl);
    const repositoryPath = repositoryParts.map(encodeURIComponent).join("/");
    const normalizedServerUrl = serverUrl.toString().replace(/\/$/, "");

    return `${normalizedServerUrl}/${repositoryPath}/actions/runs/${maybeRunId}`;
  } catch {
    return null;
  }
}
