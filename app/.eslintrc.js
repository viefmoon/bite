module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  env: {
    'react-native/react-native': true,
    node: true,
    es2021: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      ignoreRestSiblings: true
    }],
    '@typescript-eslint/no-explicit-any': 'off', // Too many to fix now
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-namespace': 'off',

    // React
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Using TypeScript
    'react/display-name': 'off',

    // React Native
    'react-native/no-inline-styles': 'error', // Refactored to use StyleSheet
    'react-native/no-color-literals': 'off',
    'react-native/no-raw-text': 'off',
    'react-native/sort-styles': 'off',
    'react-native/no-unused-styles': 'off', // Disabled - too many false positives

    // React Hooks
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',

    // General
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'prettier/prettier': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-prototype-builtins': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    '.expo/',
    'babel.config.js',
    'metro.config.js',
    '*.config.js',
    '.eslintrc.js',
  ],
};