module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  ignorePatterns: ['*.js'],
  rules: {
    'indent': ['error', 2, { 'SwitchCase': 1}],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'space-infix-ops': 'error',
    'keyword-spacing': 'error',
    'space-before-function-paren': ['error', 'always'],
    'space-before-blocks': ['error', 'always'],
    'arrow-spacing': 'error',
    'object-curly-spacing': 'error',
    '@typescript-eslint/type-annotation-spacing': 'error',
  }
};
