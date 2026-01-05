module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/services/**/*.{ts,tsx}",
    "src/utils/**/*.{ts,tsx}",
    "!src/**/*.d.ts"
  ],
  coverageReporters: ["json", "lcov", "text", "clover"],
  coverageThreshold: {
    "global": {
      "branches": 25,
      "functions": 25,
      "lines": 30,
      "statements": 30
    },
    "src/services/GoalService.ts": {
      "statements": 35
    },
    "src/services/UserService.ts": {
      "statements": 30
    }
  }
};
