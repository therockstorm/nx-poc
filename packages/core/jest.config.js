module.exports = {
  collectCoverageFrom: ["**/src/**", "!**/src/__*__/**"],
  coverageDirectory: "../../coverage/packages/core",
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  displayName: "core",
  preset: "../../jest.preset.cjs",
};
