import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import pluginVue from 'eslint-plugin-vue'
import pluginPinia from 'eslint-plugin-pinia'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import vuetify from 'eslint-plugin-vuetify'
import oxlintPlugin from 'eslint-plugin-oxlint'
import { recommended as anzuRecommended } from '@anzusystems/common-admin/eslint'
import validRouteName from './eslint/rules/valid-route-name.mjs'

const { buildFromOxlintConfigFile } = oxlintPlugin

// Written by unplugin-auto-import during `yarn generate:dts`, which `yarn ci` runs before
// eslint. A missing file is not fatal -- a bare `npx eslint` on a fresh clone still lints,
// it only loses the rules below.
const autoImportGlobalsPath = new URL('./.eslintrc-auto-import.json', import.meta.url)
const autoImportGlobals = existsSync(autoImportGlobalsPath)
  ? JSON.parse(readFileSync(autoImportGlobalsPath, 'utf8')).globals
  : {}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      '**/coverage/**',
      '.stylelintrc.js',
      '**/e2e/**',
      'src/typed-router.d.ts',
      'src/auto-imports.d.ts',
    ],
  },
  {
    // eslint-plugin-vue resolves `ref`, `computed` and friends through the import statement,
    // and falls back to a global of the same name. Auto-imports remove the import without
    // declaring the global, so both paths miss and five error-level rules go quiet here --
    // no-ref-as-operand, no-side-effects-in-computed-properties, return-in-computed-property,
    // no-async-in-computed-properties, no-ref-object-reactivity-loss -- plus
    // no-lifecycle-after-await and no-watch-after-await, which need the same globals but only
    // fire on an Options-API `setup()`, which this codebase does not have.
    // (require-typed-ref had the same hole; it is oxlint's now, and oxlint does not need the
    // import.) vue/valid-next-tick stays dead either way: it insists on a real ImportBinding.
    name: 'app/auto-import-globals',
    languageOptions: {
      globals: autoImportGlobals,
    },
  },
  pluginVue.configs['flat/essential'],
  pluginVue.configs['flat/strongly-recommended'],
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'app/pinia',
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
  anzuRecommended({ deprecatedImports: 'error' }),
  {
    name: 'app/rules',
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
      // 'error' here, 'off' in the other admins: this repo has two `any` in `src` and has been
      // enforcing it, so adopting the shared config must not quietly switch it back off.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          caughtErrors: 'none',
        },
      ],
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['Acl'],
        },
      ],
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      'vue/no-template-target-blank': ['error'],
      'vue/block-order': ['error', { order: [['script', 'template'], 'style'] }],
      'vue/define-macros-order': ['error'],
      'vue/component-name-in-template-casing': ['error'],
      'vue/component-api-style': ['error'],
      'vue/prefer-define-options': ['error'],
      'vue/no-setup-props-reactivity-loss': ['error'],
      'vue/no-ref-object-reactivity-loss': ['error'],
    },
  },
  {
    // Application code only: this config file itself has to reach its local rule relatively.
    name: 'app/no-relative-imports',
    files: ['src/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', './*'],
              message: 'Use absolute imports with @ instead of relative imports',
            },
          ],
        },
      ],
    },
  },
  {
    // File-based routing names these files, not us: `index.vue`, `new.vue`, `edit.vue`.
    name: 'app/file-based-routing',
    files: ['src/pages/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    name: 'app/test-files',
    files: ['**/*.test.{ts,js}', '**/*.spec.{ts,js}', '**/test/**/*.{ts,js}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'vue/one-component-per-file': 'off',
    },
  },
  ...vuetify.configs['flat/recommended-v4'],
  // Derives the disabled-rule list from .oxlintrc.json, so a rule enabled there stops being
  // run twice. The path is resolved against this file, not the cwd: with a bare
  // '.oxlintrc.json' an eslint run started from a subdirectory prints
  // "could not find oxlint config file" and silently re-enables all 126 rules. Six rules are switched off in that file on purpose, so that they stay eslint's.
  // Five of them resolve the name through eslint-plugin-vue's ReferenceTracker, which also
  // walks globals; oxlint's versions need a literal `import { computed } from 'vue'`, which
  // auto-imports removed, so handing them over would silently switch them off. Two of those
  // five (no-lifecycle-after-await, no-watch-after-await) only fire on an Options-API
  // `setup()`, which this codebase does not have -- they are listed for symmetry, not effect.
  // The sixth is prefer-const, a different hole: oxlint does not run it inside a .vue at all.
  ...(await buildFromOxlintConfigFile(fileURLToPath(new URL('./.oxlintrc.json', import.meta.url)))),
  {
    // The only eslint rules that fight oxfmt. Measured, not assumed: with this block
    // removed, eslint reports 85 warnings here and 145 in common-admin, and in both they
    // fall on these same rules and no others.
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
