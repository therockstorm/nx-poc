const shared = require("../../jest.config.cjs");

module.exports = {
  ...shared,
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  extensionsToTreatAsEsm: [".svelte", ".ts"],
  globals: { "ts-jest": { tsconfig: "tsconfig.spec.json", useESM: true } },
  moduleFileExtensions: ["js", "svelte", "ts"],
  moduleNameMapper: {
    "^\\$app(.*)$": [
      "<rootDir>/.svelte-kit/dev/runtime/app$1",
      "<rootDir>/.svelte-kit/build/runtime/app$1",
    ],
    "\\.(css)$": "identity-obj-proxy",
    "^\\$lib(.*)$": "<rootDir>/src/lib$1",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom/extend-expect"],
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.svelte$": [
      "../../node_modules/svelte-jester/dist/transformer.mjs",
      { preprocess: true },
    ],
    "^.+\\.ts$": "ts-jest",
  },
};
