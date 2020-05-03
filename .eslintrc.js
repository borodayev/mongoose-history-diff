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
  ],
  plugins: [
    '@typescript-eslint',
    'jest',
    'prettier',
  ],
  "env": {
    "jest/globals": true,
    "jasmine": true,
    "jest": true
  },
}
