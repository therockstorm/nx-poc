module.exports = {
  extends: ["../../.eslintrc.cjs"],
  ignorePatterns: ["!**/*", "node_modules"],
  rules: {
    "no-undef": "off",
    "no-restricted-imports": ["error", "svelte"],
  },
};
