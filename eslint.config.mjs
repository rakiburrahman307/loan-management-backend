import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettier from 'eslint-plugin-prettier';
import configPrettier from 'eslint-config-prettier';

export default [
     { files: ['**/*.{js,mjs,cjs,ts}'] },
     {
          languageOptions: {
               globals: globals.browser,
          },
     },
     pluginJs.configs.recommended,
     ...tseslint.configs.recommended,
     // Add Prettier recommended config disables conflicting rules
     ...configPrettier.flatConfig,

     // Enable prettier plugin with error level for formatting issues
     {
          plugins: {
               prettier: pluginPrettier,
          },
          rules: {
               'prettier/prettier': 'error',
               'no-unused-expressions': 'error',
               'prefer-const': 'error',
               'no-console': 'warn',
               'no-undef': 'error',
               '@typescript-eslint/no-explicit-any': 'off',
               '@typescript-eslint/no-unused-vars': [
                    'error',
                    {
                         argsIgnorePattern: '^_',
                         varsIgnorePattern: '^_',
                         ignoreRestSiblings: true,
                    },
               ],
          },
          ignores: ['node_modules', 'dist'],
          languageOptions: {
               globals: {
                    process: 'readonly',
               },
          },
     },
];
