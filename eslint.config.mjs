import { existsSync, readFileSync } from 'node:fs'

// Written by unplugin-auto-import during `yarn generate:dts`, which `yarn ci` runs before
// eslint. A missing file is not fatal -- a bare `npx eslint` on a fresh clone still lints,
// it only loses the rules below.
const autoImportGlobalsPath = new URL('./.eslintrc-auto-import.json', import.meta.url)
const autoImportGlobals = existsSync(autoImportGlobalsPath)
  ? JSON.parse(readFileSync(autoImportGlobalsPath, 'utf8')).globals
  : {}

import pluginVue from 'eslint-plugin-vue'
import pluginPinia from 'eslint-plugin-pinia'
import pluginVuetify from 'eslint-plugin-vuetify'
import oxlint from 'eslint-plugin-oxlint'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

import { recommended as anzuRecommended } from '@anzusystems/common-admin/eslint'
import validRouteName from './eslint/rules/valid-route-name.mjs'

export default defineConfigWithVueTs(
  {
    // eslint-plugin-vue resolves `ref`, `computed` and friends through the import statement,
    // and falls back to a global of the same name. Auto-imports remove the import without
    // declaring the global, so both paths miss and five error-level rules go quiet here --
    // no-ref-as-operand, no-side-effects-in-computed-properties, return-in-computed-property,
    // no-async-in-computed-properties, no-ref-object-reactivity-loss -- plus
    // no-lifecycle-after-await and no-watch-after-await, which need the same globals but only
    // fire on an Options-API `setup()`.
    name: 'app/auto-import-globals',
    languageOptions: {
      globals: autoImportGlobals,
    },
  },
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '.stylelintrc.js', '**/cypress/**', 'src/typed-router.d.ts', 'src/auto-imports.d.ts'],
  },
  pluginVue.configs['flat/essential'],
  pluginVue.configs['flat/strongly-recommended'],
  pluginVue.configs['flat/recommended'],
  ...pluginVuetify.configs['flat/recommended-v4'],
  vueTsConfigs.recommended,
  {
    plugins: {
      pinia: pluginPinia,
    },
    rules: {
      'pinia/never-export-initialized-store': 'error',
      'pinia/no-duplicate-store-ids': 'error',
      'pinia/no-return-global-properties': 'error',
      'pinia/no-store-to-refs-in-store': 'error',
      'pinia/prefer-single-store-per-file': 'error',
      'pinia/prefer-use-store-naming-convention': 'error',
      'pinia/require-setup-store-properties-export': 'error',
    },
  },
  anzuRecommended({
    // Fully migrated off the deprecated @anzusystems/common-admin barrel onto /labs,
    // including the author/keyword cached-tagging components (now on the labs
    // AFormRemoteAutocompleteWithCached). Rule fully enforced — no skips.
    deprecatedImports: 'error',
  }),
  {
    plugins: {
      'anzu-local': {
        rules: {
          'valid-route-name': validRouteName,
        },
      },
    },
    rules: {
      'anzu-local/valid-route-name': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-interface': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      'vue/no-template-target-blank': ['error'],
      'vue/block-order': ['error', { order: [['script', 'template'], 'style'] }],
      'vue/define-macros-order': ['error'],
      'vue/component-name-in-template-casing': ['error'],
      'vue/component-api-style': ['error'],
      'vue/prefer-define-options': ['error'],
      'vue/require-typed-ref': ['error'],
      'vue/no-setup-props-reactivity-loss': ['error'],
      'vue/no-ref-object-reactivity-loss': ['error'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
        },
      ],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-restricted-syntax': [
        'error',
        {
          // A bare `x.validateAll()` statement throws away its boolean — it reveals row errors but does
          // NOT block the save, so a collapsed invalid row slips through (QA 85050). Either gate on it
          // (`if (x.validateAll() === false) return`) or pass `:validation-scope` to the list editor.
          selector: 'ExpressionStatement > CallExpression[callee.property.name="validateAll"]',
          message:
            'Bare validateAll() discards its result and does NOT block the save (QA 85050). Gate on it (if (x.validateAll() === false) return) or pass :validation-scope to the list editor.',
        },
        {
          selector: 'ExpressionStatement > ChainExpression > CallExpression[callee.property.name="validateAll"]',
          message:
            'Bare validateAll() discards its result and does NOT block the save (QA 85050). Gate on it (if (x.validateAll() === false) return) or pass :validation-scope to the list editor.',
        },
        {
          // Same, awaited: `await x.validateAll()` as a statement still discards the boolean.
          selector: 'ExpressionStatement > AwaitExpression > CallExpression[callee.property.name="validateAll"]',
          message:
            'Bare validateAll() discards its result and does NOT block the save (QA 85050). Gate on it (if (x.validateAll() === false) return) or pass :validation-scope to the list editor.',
        },
        {
          selector:
            'ExpressionStatement > AwaitExpression > ChainExpression > CallExpression[callee.property.name="validateAll"]',
          message:
            'Bare validateAll() discards its result and does NOT block the save (QA 85050). Gate on it (if (x.validateAll() === false) return) or pass :validation-scope to the list editor.',
        },
      ],
    },
  },
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
  {
    // The only eslint rules that fight oxfmt. Measured: with this block removed, eslint
    // reports on these same rules and no others, in every repo we checked.
    //
    // html-self-closing is configured rather than switched off, because only its `void`
    // half conflicts: oxfmt writes `<img />` where the rule's default demands `<img>`.
    // With `void: 'any'` the formatter keeps that half and eslint keeps `<VBtn></VBtn>`.
    name: 'app/owned-by-oxfmt',
    rules: {
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': [
        'error',
        {
          html: { void: 'any', normal: 'always', component: 'always' },
          svg: 'always',
          math: 'always',
        },
      ],
    },
  }
)
