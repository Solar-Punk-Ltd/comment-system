import "jest";

export default {
  moduleFileExtensions: ["ts", "js", "json"],
  testMatch: ["**/test/**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: ["/node_modules/"],
  rootDir: "test",
  testTimeout: 60000,
  testPathIgnorePatterns: ["/node_modules/"],
  moduleDirectories: ["node_modules"],
};
