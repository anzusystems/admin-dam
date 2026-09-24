import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

import { recommended as anzuRecommended } from '@anzusystems/common-admin/eslint'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import oxlintPlugin from 'eslint-plugin-oxlint'
import pluginPinia from 'eslint-plugin-pinia'
import pluginVue from 'eslint-plugin-vue'
import vuetify from 'eslint-plugin-vuetify'

import validRouteName from './eslint/rules/valid-route-name.mjs'

const { buildFromOxlintConfigFile } = oxlintPlugin

const getVuetifyComponents = () => {
  try {
    const content = fs.readFileSync(new URL('./node_modules/vuetify/dist/vuetify.d.ts', import.meta.url), 'utf-8')
    const match = content.match(/interface GlobalComponents \{([\s\S]*?)\}/)
    if (match && match[1]) {
      const matches = match[1].matchAll(/^\s+([V][a-zA-Z0-9]+):/gm)
      return Array.from(matches, (m) => m[1])
    }
    return []
  } catch (e) {
    console.error('Error reading vuetify.d.ts', e)
    return []
  }
}
const vuetifyComponents = getVuetifyComponents()

const getCommonAliases = () => {
  try {
    const content = fs.readFileSync(
      new URL('./node_modules/@anzusystems/common-admin/dist/common-admin.d.ts', import.meta.url),
      'utf-8'
    )
    const match = content.match(/commonAliases: \(\) => \{([\s\S]*?)\};/)
    if (match && match[1]) {
      const matches = match[1].matchAll(/^\s+([A-Z][a-zA-Z0-9]+):/gm)
      return Array.from(matches, (m) => m[1])
    }
    return []
  } catch (e) {
    console.error('Error reading common-admin.d.ts', e)
    return []
  }
}
const commonAliases = getCommonAliases()

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
    ],
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
  anzuRecommended(),
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
      'vue/no-undef-components': [
        'error',
        {
          // Registered globally rather than imported, so the rule cannot see them:
          // `Acl` by common-admin's own plugin (AnzuSystemsCommonAdmin.ts:98) and the `GMap*`
          // family by vue-google-maps-community-fork, which admin-inhouse installs.
          ignorePatterns: [
            ...vuetifyComponents,
            ...commonAliases,
            'RouterLink',
            'RouterView',
            'Acl',
            'GMapMap',
            'GMapCluster',
            'GMapMarker',
          ],
        },
      ],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/v-on-event-hyphenation': ['error', 'always'],
      'vue/custom-event-name-casing': ['error', 'camelCase'],
      'vue/define-emits-declaration': ['error', 'type-based'],
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
  // "could not find oxlint config file" and silently re-enables all 126 rules. prefer-const is
  // switched off in that file on purpose, so that it stays eslint's: oxlint does not run it inside
  // a .vue at all.
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
