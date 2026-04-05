import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

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

const buildInfo = {
  version: readPackageVersion(),
  commit: maybeReadGitCommit(),
  builtAt: new Date().toISOString(),
};

export default defineConfig({
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(buildInfo.version),
    "import.meta.env.VITE_GIT_COMMIT": JSON.stringify(buildInfo.commit),
    "import.meta.env.VITE_BUILD_TIMESTAMP": JSON.stringify(buildInfo.builtAt),
  },
  plugins: [solid()],
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
