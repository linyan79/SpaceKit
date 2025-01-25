import eslint from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import tsParser from '@typescript-eslint/parser';
import tseslint from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: __dirname
});

export default [
  eslint.configs.recommended,
  ...compat.config({
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:react/recommended'
    ]
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: resolve(__dirname, 'tsconfig.eslint.json'),
        ecmaFeatures: {
          jsx: true
        },
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error'
    }
  },
  {
    files: ['**/*.jsx', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: resolve(__dirname, 'tsconfig.json'),
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        React: true,
        JSX: true
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    plugins: {
      'react': reactPlugin
    },
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/.next'
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error'
    }
  }
];
