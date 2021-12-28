const shared = require("../../jest.config.cjs");

module.exports = {
  ...shared,
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
};
