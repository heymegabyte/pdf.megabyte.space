/**
 * Minimal local ESLint config.
 *
 * `root: true` stops ESLint from walking up to the user's personal
 * config at `~/.eslintrc*` — that file pulls in a broken plugin chain
 * (`eslint-config-strict-mode` -> retired `@typescript-eslint/experimental-utils`)
 * that crashes lint with a TypeError before any rule runs.
 *
 * Keep this file small: project-specific rule churn belongs in code review
 * conventions and `tsc --strict`, not in a sprawling lint config.
 */
module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2023: true,
    worker: true,
  },
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.wrangler/',
    'smoke-screens/',
    '.playwright-mcp/',
    'drizzle/',
    'public/',
    'tests/',
    'scripts/',
    '*.config.ts',
    '*.config.js',
    '*.config.cjs',
    '*.config.mjs',
  ],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      rules: {
        // TypeScript handles unused-vars more accurately; disable core rule.
        'no-unused-vars': 'off',
        // Don't flag legitimate uses of `undefined`.
        'no-undef': 'off',
      },
    },
  ],
  rules: {
    'no-debugger': 'error',
    'no-cond-assign': ['error', 'except-parens'],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-irregular-whitespace': 'error',
    'no-self-assign': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    eqeqeq: ['error', 'smart'],
    'no-var': 'error',
    'prefer-const': 'warn',
  },
};
