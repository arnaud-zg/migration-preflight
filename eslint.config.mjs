import base from "@arnaud-zg/configs/eslint";
import tseslint from "typescript-eslint";

/**
 * Monorepo-wide base: @arnaud-zg/configs's framework-agnostic rules, plus typed linting wired to
 * every package's own tsconfig.json. An explicit glob (rather than typescript-eslint's
 * `projectService` auto-discovery) is what reliably resolves each file to its owning package's
 * project when a single `eslint .` invocation from the repo root lints all packages at once.
 */
export default tseslint.config(...base, {
  files: ["**/*.{ts,tsx}"],
  ignores: ["**/dist/**"],
  languageOptions: {
    parserOptions: {
      project: ["packages/*/tsconfig.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
