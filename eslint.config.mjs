// Backend lint: typed rules against detached promises. A promise that is neither awaited nor handled is lost when Lambda
// freezes the process after the response (aws_lambda preset), e.g. a verification email that never goes out.
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig(
  { ignores: ['**/node_modules/**', '**/.nitro/**', '**/.output/**', '**/dist/**', '**/.nuxt/**'] },
  {
    files: ['{packages/core,packages/auth,packages/db,packages/shared,apps/api,apps/mcp}/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Tests and configs that no tsconfig includes are checked with the auth package's compiler options.
        projectService: {
          allowDefaultProject: ['packages/{auth,db}/test/*.ts', 'apps/mcp/test/*.ts', 'packages/db/drizzle.config.ts', 'packages/shared/src/*.ts'],
          defaultProject: 'packages/auth/tsconfig.json',
          // ponytail: one shared program for these files; give them their own tsconfig if linting gets slow.
          maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 64,
        },
      },
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      '@typescript-eslint/no-floating-promises': [
        'error',
        // `void promise` is not an exemption: on Lambda a detached promise is lost all the same.
        // node:test runs top-level test()/describe() itself; awaiting them is not needed.
        { ignoreVoid: false, allowForKnownSafeCalls: [{ from: 'package', package: 'node:test', name: ['test', 'it', 'describe', 'suite'] }] },
      ],
      // An async function with no await usually detached its work, like the original `void send().catch()`.
      '@typescript-eslint/require-await': 'error',
    },
  },
  // Test doubles implement async interfaces without awaiting anything.
  { files: ['**/test/**/*.ts', '**/*.test.ts'], rules: { '@typescript-eslint/require-await': 'off' } },
)
