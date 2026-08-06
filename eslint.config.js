const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

/**
 * Beyond Expo's defaults, two rules encode architecture decisions that are
 * otherwise only written down in the docs:
 *
 *  1. `process.env` is readable in exactly one file (`src/config/env.ts`).
 *     Expo only inlines literal `process.env.EXPO_PUBLIC_*` expressions, so a
 *     stray dynamic read silently becomes `undefined` in a release build.
 *
 *  2. Route files cannot import the API layer. `src/app` does routing, route
 *     params, navigation options and screen composition — data access belongs
 *     to `src/features/<feature>`.
 */
module.exports = defineConfig([
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'coverage/**', 'expo-env.d.ts'],
  },

  expoConfig,
  prettierConfig,

  {
    rules: {
      // False positives on CommonJS-interop default exports that also expose
      // named ones — `axios.create` and `i18n.use` are the documented APIs.
      'import/no-named-as-default-member': 'off',
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/config/env.ts', 'src/testing/jest-env.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: 'Read environment variables through `@/config/env`, never `process.env`.',
        },
      ],
    },
  },

  {
    files: ['src/app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'Route files must not call the API. Put data access in src/features/<feature>/api.ts.',
            },
            {
              name: '@/api/client',
              message:
                'Route files must not call the API. Use a hook from src/features/<feature>/queries.ts.',
            },
            {
              name: '@/api/request',
              message:
                'Route files must not call the API. Use a hook from src/features/<feature>/queries.ts.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['**/*.test.{ts,tsx}', 'src/testing/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
