module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: [
    'airbnb-typescript/base',
    'prettier/@typescript-eslint',
    'plugin:import/typescript',
    'plugin:jest/all',
    'plugin:prettier/recommended',
  ],
  plugins: [
    '@typescript-eslint',
    'jest',
    'prettier',
  ],
  env: {
    'jest/globals': true,
    'jasmine': true,
    'jest': true
  },
  rules: {
    'prettier/prettier': ['error', { 'singleQuote': true }],
    'lines-between-class-members': 0,
    'no-underscore-dangle': 0,
  }
}
