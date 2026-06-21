/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  rules: {
    // NestJS conventions
    '@typescript-eslint/no-extraneous-class': 'off', // DTOs use classes
    '@typescript-eslint/no-empty-interface': 'off',
    'no-console': 'off', // NestJS logger uses console
  },
};
