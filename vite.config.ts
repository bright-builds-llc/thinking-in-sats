import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

import { maybeCreateGitHubActionsRunUrl } from "./src/domain/buildProvenance";

function maybeReadGitCommit(): string {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "Unavailable";
  }
}

function readPackageVersion(): string {
  try {
    const packageJson = JSON.parse(readFileSync("./package.json", "utf8")) as {
      version?: string;
    };

    return packageJson.version?.trim() || "Unavailable";
  } catch {
    return "Unavailable";
  }
}

function readBasePath(): string {
  const maybeBasePath = process.env.PAGES_BASE_PATH?.trim();

  if (!maybeBasePath) {
    return "/";
  }

  const normalizedLeadingSlash = maybeBasePath.startsWith("/")
    ? maybeBasePath
    : `/${maybeBasePath}`;

  return normalizedLeadingSlash.endsWith("/")
    ? normalizedLeadingSlash
    : `${normalizedLeadingSlash}/`;
}

const buildInfo = {
  version: readPackageVersion(),
  commit: maybeReadGitCommit(),
  builtAt: new Date().toISOString(),
  maybeBuildRunUrl: maybeCreateGitHubActionsRunUrl({
    maybePagesBasePath: process.env.PAGES_BASE_PATH,
    maybeRepository: process.env.GITHUB_REPOSITORY,
    maybeRunId: process.env.GITHUB_RUN_ID,
    maybeServerUrl: process.env.GITHUB_SERVER_URL,
  }),
};

const basePath = readBasePath();

export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(buildInfo.version),
    "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(buildInfo.commit),
    "import.meta.env.VITE_BUILD_TIMESTAMP": JSON.stringify(buildInfo.builtAt),
    "import.meta.env.VITE_BUILD_RUN_URL": JSON.stringify(
      buildInfo.maybeBuildRunUrl,
    ),
  },
  plugins: [solid()],
  optimizeDeps: {
    exclude: ["mystic-ui"],
  },
  server: {
    port: 4173,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
});
