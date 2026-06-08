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
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'off',
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
    'vue/no-mutating-props': 'warn',
    'vue/require-default-prop': 'off',
    'vue/require-prop-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-undef': 'error',
    // 中文文案里常使用全角空格/不间断空格作为视觉分隔，关掉避免误报
    'no-irregular-whitespace': 'off',
    'no-mixed-spaces-and-tabs': 'off',
    // 预存代码中大量 `let` 未被重新赋值，但本 PR 不打算重写业务代码，临时降为 warn
    'prefer-const': 'warn',
  },
  overrides: [
    {
      files: ['tests/**/*', '**/*.test.ts'],
      env: { node: true },
    },
    {
      files: ['*.config.js', '*.config.cjs', '*.config.ts'],
      env: { node: true },
      rules: { '@typescript-eslint/no-var-requires': 'off' },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'unpackage/', '*.d.ts', 'coverage/', '.git/'],
}
