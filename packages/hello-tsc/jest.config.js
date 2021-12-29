module.exports = {
  collectCoverageFrom: ["**/src/**", "!**/src/__*__/**"],
  coverageDirectory: "../../coverage/packages/hello-tsc",
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
  displayName: "hello-tsc",
  preset: "../../jest.preset.js",
};
