import type { Config } from 'jest';

const commonCoverage = {
  statements: 80,
  lines: 80,
};

const config: Config = {
  coverageThreshold: {
    global: commonCoverage,
  },
  projects: [
    {
      displayName: 'backend-unit',
      testMatch: ['<rootDir>/backend/tests/unit/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/backend/tsconfig.json' }],
      },
      collectCoverageFrom: [
        'backend/src/controllers/auth-controller.ts',
        'backend/src/middleware/auth-guard.ts',
        'backend/src/middleware/error-handler.ts',
        'backend/src/middleware/csrf-guard.ts',
        'backend/src/services/auth-service.ts',
        'backend/src/services/password-reset-service.ts',
        'backend/src/validators/auth-validator.ts',
        'backend/src/validators/common.ts',
        'backend/src/validators/idea-query-validator.ts',
        'backend/src/repositories/auth-throttle-repository.ts',
        'backend/src/repositories/csrf-token-repository.ts',
        'backend/src/repositories/password-reset-repository.ts',
        'backend/src/repositories/session-repository.ts',
        'backend/src/repositories/user-repository.ts',
        'backend/src/repositories/index.ts',
        'backend/src/lib/auth-tokens.ts',
        'backend/src/lib/passwords.ts',
        'backend/src/lib/domain-constants.ts',
      ],
    },
    {
      displayName: 'backend-integration',
      testMatch: ['<rootDir>/backend/tests/integration/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/backend/tsconfig.json' }],
      },
      collectCoverageFrom: ['backend/src/**/*.ts'],
    },
    {
      displayName: 'frontend-unit',
      testMatch: ['<rootDir>/frontend/tests/unit/**/*.test.ts?(x)'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/frontend/tsconfig.json' }],
      },
      collectCoverageFrom: [
        'frontend/src/features/auth/components/ProtectedRoute.tsx',
        'frontend/src/features/auth/hooks/useAuth.ts',
        'frontend/src/features/auth/pages/LoginPage.tsx',
        'frontend/src/features/auth/pages/RegisterPage.tsx',
        'frontend/src/features/auth/pages/PasswordResetRequestPage.tsx',
        'frontend/src/features/auth/pages/PasswordResetConfirmPage.tsx',
        'frontend/src/features/auth/services/auth-error-mapper.ts',
        'frontend/src/features/auth/services/auth-service.ts',
        'frontend/src/features/shared/Alert.tsx',
      ],
    },
    {
      displayName: 'frontend-integration',
      testMatch: ['<rootDir>/frontend/tests/integration/**/*.test.ts?(x)'],
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/frontend/tsconfig.json' }],
      },
      collectCoverageFrom: ['frontend/src/**/*.ts', 'frontend/src/**/*.tsx', '!frontend/src/main.tsx'],
    },
  ],
};

export default config;
