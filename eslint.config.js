import js from "@eslint/js";
import solidPlugin from "eslint-plugin-solid";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist/**", "coverage/**", "workspace/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    ...solidPlugin.configs["flat/typescript"],
    languageOptions: {
      ...solidPlugin.configs["flat/typescript"].languageOptions,
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...solidPlugin.configs["flat/typescript"].rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
