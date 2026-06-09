/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  globals: {
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
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module',
    extraFileExtensions: ['.vue'],
  },
  plugins: ['@typescript-eslint', 'vue'],
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
    // v-for 的索引变量 i/j/k 等常用作占位，放宽为 warn
    'vue/no-unused-vars': ['warn', { ignorePattern: '^_' }],
    // 业务代码大量使用 v-if/v-for 同级，先降级为 warn，待后续重构
    'vue/no-use-v-if-with-v-for': 'warn',
    'vue/no-mutating-props': 'error',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'warn',

    // TypeScript 规则
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',

    // 通用规则
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-undef': 'error',
    // 中文文案里常使用全角空格/不间断空格作为视觉分隔，关掉避免误报
    'no-irregular-whitespace': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    'prefer-const': 'error',
  },
  overrides: [
    {
      files: ['*.config.js', '*.config.cjs', '*.config.ts'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'unpackage/', '*.d.ts', 'coverage/', '.git/'],
}
