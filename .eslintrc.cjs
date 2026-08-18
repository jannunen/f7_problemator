/**
 * The mobile app had no ESLint config at all, and its lint script covered only
 * .js/.jsx — so none of the 104 .vue components were ever linted.
 *
 * The point of this config is not style. It is the small set of rules that
 * catch bugs the build cannot: undefined variables referenced from a template,
 * props mutated in place, and side effects inside computed getters. That last
 * pair is what let a child component quietly reorder Vuex state.
 */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: ['plugin:vue/vue3-recommended', 'eslint:recommended'],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@babel/eslint-parser',
    requireConfigFile: false,
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  globals: {
    // Vue compiler macros — not imports, so no-undef cannot see them.
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly',
    // Injected by vite-plugin-environment / package-version at build time.
    process: 'readonly',
  },
  rules: {
    // The reactivity rules. These are the reason this config exists — leave
    // them on. A violation is a real bug, not a preference.
    'vue/no-mutating-props': 'error',
    'vue/no-side-effects-in-computed-properties': 'error',

    // 206 of these, almost all harmless (unused imports, destructured-but-
    // unused args). Warn rather than error so the genuine errors below stay
    // visible instead of being buried.
    'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],
    'vue/no-unused-vars': 'warn',
    // Prop defaults for objects/arrays must be factories. Real, but 12 of them
    // and each needs a judgement call about the right default.
    'vue/require-valid-default-prop': 'warn',

    'no-console': 'off',
    'no-debugger': 'warn',

    // Template formatting. Turned off deliberately: with them on, thousands of
    // indentation complaints bury the handful of findings that matter.
    'vue/max-attributes-per-line': 'off',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/multiline-html-element-content-newline': 'off',
    'vue/html-indent': 'off',
    'vue/html-self-closing': 'off',
    'vue/attributes-order': 'off',
    'vue/first-attribute-linebreak': 'off',
    'vue/html-closing-bracket-newline': 'off',
    'vue/html-closing-bracket-spacing': 'off',
    'vue/mustache-interpolation-spacing': 'off',
    'vue/no-multi-spaces': 'off',
    'vue/order-in-components': 'off',
    'vue/prop-name-casing': 'off',
    'vue/no-v-html': 'off',
    'vue/require-prop-types': 'off',
    'vue/require-explicit-emits': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'vue/attribute-hyphenation': 'off',
    'vue/v-on-event-hyphenation': 'off',
  },
  ignorePatterns: ['www/', 'dist/', 'node_modules/', 'cordova/', '*.config.js'],
}
