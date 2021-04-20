module.exports = {
  extends: 'erb',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.js'),
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  rules: {
    'no-underscore-dangle': 'off',
    'no-console': 'off', // TODO later,
    '@typescript-eslint/no-explicit-any': 'off', // TODO later
    'no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    'import/no-extraneous-dependencies': 'off', // due to electron project structure
    'react/display-name': 'off',
    'react/prop-types': 'off', // TODO later
    'react/destructuring-assignment': 'off', // TODO later
    'react/sort-comp': 'off',
  },
};
