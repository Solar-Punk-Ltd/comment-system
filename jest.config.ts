import "jest";

export default {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["<rootDir>/**/*.spec.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/"],
  coverageReporters: ["lcov"],
  collectCoverageFrom: ["./src/**"],
  verbose: true,
  rootDir: "test",
  testTimeout: 60000,
  testPathIgnorePatterns: ["/node_modules/"],
  moduleDirectories: ["node_modules"],
  projects: [
    {
      displayName: "unit",
      testMatch: ["<rootDir>/test/**/*.spec.ts"],
    },
  ],
};
