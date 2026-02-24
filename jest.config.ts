import type { Config } from 'jest';

const commonCoverage = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

const config: Config = {
  collectCoverageFrom: ['backend/src/**/*.ts', 'frontend/src/**/*.{ts,tsx}'],
  coverageThreshold: {
    global: commonCoverage,
  },
  projects: [
    {
      displayName: 'backend-unit',
      testMatch: ['<rootDir>/backend/tests/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/backend/tsconfig.json',
        },
      },
    },
    {
      displayName: 'backend-integration',
      testMatch: ['<rootDir>/backend/tests/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/backend/tsconfig.json',
        },
      },
    },
    {
      displayName: 'frontend-unit',
      testMatch: ['<rootDir>/frontend/tests/unit/**/*.test.ts?(x)'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/frontend/tsconfig.json',
        },
      },
    },
    {
      displayName: 'frontend-integration',
      testMatch: ['<rootDir>/frontend/tests/integration/**/*.test.ts?(x)'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      globals: {
        'ts-jest': {
          tsconfig: '<rootDir>/frontend/tsconfig.json',
        },
      },
    },
  ],
};

export default config;
