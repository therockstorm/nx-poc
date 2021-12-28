module.exports = {
  collectCoverageFrom: ["**/src/**", "!**/src/__*__/**"],
  coverageDirectory: "../../coverage/packages/lib",
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
  displayName: "lib",
  preset: "../../jest.preset.js",
};
