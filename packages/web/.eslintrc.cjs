module.exports = {
  env: { browser: true, es2017: true, node: true },
  extends: ["../../.eslintrc.cjs", "plugin:testing-library/react"],
  ignorePatterns: ["*.cjs", "!**/*", "node_modules"],
  overrides: [{ files: ["*.svelte"], processor: "svelte3/svelte3" }],
  settings: { "svelte3/typescript": () => require("typescript") },
  parserOptions: { sourceType: "module", ecmaVersion: 2020 },
  plugins: ["jest-dom", "testing-library", "svelte3"],
};
