/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js', 'next/core-web-vitals'],
  plugins: ['react', 'react-hooks'],
  rules: {
    'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary'] }],
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/self-closing-comp': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@next/next/no-img-element': 'error',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
