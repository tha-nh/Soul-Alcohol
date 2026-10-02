module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*|@op-engineering/.*)/)',
  ],

  // Coverage is measured on the logic layers only. Deliberately left out:
  //  - screens/, navigation/, components/, app/: UI, covered by the App smoke test, not worth unit-test effort yet
  //  - services/: mock capture services and native bridges, replaced when real sensors/models land
  //  - use*.ts hooks: need a React renderer to test; add them here once they have tests
  //  - index.ts barrels, type-only files (models/, engines.ts), dev config
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    'src/repositories/**/*.ts',
    'src/database/**/*.ts',
    'src/utils/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/**/use*.ts',
    '!src/domain/alertness/engines.ts',
  ],
  coverageReporters: ['text', 'html', 'lcov'],
  // Measured at 99/87/98/99 (stmts/branch/funcs/lines) when set; the margin leaves room for
  // normal change but fails the build if tests stop keeping up with the logic layers.
  coverageThreshold: {
    global: { statements: 90, branches: 80, functions: 90, lines: 90 },
  },
};
