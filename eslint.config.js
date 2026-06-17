// @ts-check
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default [
  // 忽略目录与文件
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'unpackage/**',
      'coverage/**',
      '.git/**',
      '**/*.d.ts',
      'CHANGELOG.md',
    ],
  },

  // JS/TS/Vue 基础配置
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],

  // uni-app x 全局对象
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // uni-app x 全局对象与 API
        uni: 'readonly',
        UniApp: 'readonly',
        Uni: 'readonly',
        getCurrentPages: 'readonly',
        getApp: 'readonly',
        wx: 'readonly',
        plus: 'readonly',
        UniViewJSBridge: 'readonly',
        UniServiceJSBridge: 'readonly',
        __uniConfig: 'readonly',
        __GLOBAL__: 'readonly',
        // Vite define 注入的编译期常量
        __APP_VERSION__: 'readonly',
      },
    },
  },

  // .vue 文件
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
  },

  // 业务代码规则
  {
    files: ['**/*.{js,ts,vue}'],
    rules: {
      // Vue 规则
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/no-unused-vars': ['warn', { ignorePattern: '^_' }],
      'vue/no-use-v-if-with-v-for': 'warn',
      'vue/no-mutating-props': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-prop-types': 'warn',

      // TypeScript 规则
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',

      // 通用规则
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-undef': 'error',
      // 业务代码常用 let 预初始化变量再覆盖,ESLint 10 新增此规则误报率高
      'no-useless-assignment': 'off',
      // 中文文案里常使用全角空格/不间断空格作为视觉分隔，关掉避免误报
      'no-irregular-whitespace': 'off',
      'no-mixed-spaces-and-tabs': 'off',
      'prefer-const': 'error',
    },
  },

  // 配置文件覆盖：允许 any/console
  {
    files: ['**/*.{config.js,config.cjs,config.ts,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Prettier 必须放最后
  prettier,
]
