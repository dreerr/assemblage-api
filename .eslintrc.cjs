module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: [
    'standard',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'linebreak-style': 'off',
    'max-lines': ["error", {"max": 1000, "skipComments": true, "skipBlankLines": true }],
    'no-console': 'off',
    'no-underscore-dangle': 'off'
  },
}