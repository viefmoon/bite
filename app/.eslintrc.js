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
    'import',
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
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      typescript: {},
    },
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    // TypeScript - solo errores reales importantes
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'off', // Permitir any cuando sea necesario
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/prefer-optional-chain': 'off', // Sugerencia, no error
    '@typescript-eslint/prefer-nullish-coalescing': 'off', // Sugerencia, no error
    
    // Detectar errores reales críticos - configuración práctica  
    '@typescript-eslint/no-unsafe-argument': 'off', // Demasiado estricto en proyectos reales
    '@typescript-eslint/no-unsafe-assignment': 'off', 
    '@typescript-eslint/no-unsafe-call': 'off', // Común en APIs externas
    '@typescript-eslint/no-unsafe-member-access': 'off', 
    '@typescript-eslint/no-unsafe-return': 'off', // Común en funciones utilitarias
    
    // Errores de tipos importantes que queremos capturar
    '@typescript-eslint/no-misused-promises': 'off', // Desactivar - muy común en React Native
    '@typescript-eslint/await-thenable': 'error', // Mantener - errores reales de await
    '@typescript-eslint/no-unsafe-assignment': 'off', // Desactivar - demasiado ruido en código real
    '@typescript-eslint/strict-boolean-expressions': 'off', // Evita ser demasiado estricto con expresiones booleanas

    // Import validation básica
    'import/no-duplicates': 'error',
    'import/no-self-import': 'error',

    // React
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'off', // Using TypeScript
    'react/display-name': 'off',

    // React Native
    'react-native/no-inline-styles': 'warn', // TODO: Refactor to StyleSheet
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
