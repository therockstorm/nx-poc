module.exports = {
  collectCoverageFrom: ["**/src/**", "!**/src/__*__/**"],
  coverageDirectory: "../../coverage/packages/lib",
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5,
    },
  },
  displayName: "lib",
  preset: "../../jest.preset.cjs",
};
