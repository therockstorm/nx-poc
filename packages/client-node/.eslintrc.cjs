module.exports = {
  extends: ["../../.eslintrc.cjs"],
  ignorePatterns: ["!**/*", "node_modules"],
  rules: {
    "no-restricted-imports": ["error", "svelte"],
  },
};
