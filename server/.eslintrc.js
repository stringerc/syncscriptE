module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    // Prevent snake_case column names in raw SQL for cron locks
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TemplateLiteral[quasis.0.value.raw*="cron_locks"]',
        message: 'Use camelCase column names (jobName, lockedAt, expiresAt) in cron lock queries. Snake_case is forbidden unless annotated with // allow-sql'
      },
      {
        selector: 'Literal[value*="job_name"]',
        message: 'Use jobName instead of job_name in cron lock queries unless annotated with // allow-sql'
      },
      {
        selector: 'Literal[value*="locked_at"]',
        message: 'Use lockedAt instead of locked_at in cron lock queries unless annotated with // allow-sql'
      },
      {
        selector: 'Literal[value*="expires_at"]',
        message: 'Use expiresAt instead of expires_at in cron lock queries unless annotated with // allow-sql'
      }
    ],
    
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // General rules
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
};
