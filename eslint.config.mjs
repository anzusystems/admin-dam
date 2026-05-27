import stylistic from '@stylistic/eslint-plugin'
// import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import pluginVue from 'eslint-plugin-vue'
import pluginPinia from 'eslint-plugin-pinia'
import pluginVuetify from 'eslint-plugin-vuetify'
import oxlint from 'eslint-plugin-oxlint'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'

const tsExtensionPlugin = {
  rules: {
    'no-ts-extension': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow .ts extension in import statements',
        },
        fixable: 'code',
        schema: [],
      },
      create(context) {
        return {
          ImportDeclaration(node) {
            const source = node.source.value
            if (typeof source === 'string' && source.endsWith('.ts')) {
              context.report({
                node,
                message: 'Do not include .ts extension in import paths',
                fix(fixer) {
                  const sourceText = node.source.raw
                  const newSource = sourceText.replace(/\.ts(['"])$/, '$1')
                  return fixer.replaceText(node.source, newSource)
                },
              })
            }
          },
        }
      },
    },
  },
}

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '.stylelintrc.js', '**/cypress/**', 'src/typed-router.d.ts'],
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
  {
    plugins: {
      'ts-extension': tsExtensionPlugin,
    },
    rules: {
      'ts-extension/no-ts-extension': 'error',
    },
  },
  {
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-interface': 'off',
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['Acl'],
        },
      ],
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1 }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/comma-dangle': ['error', 'only-multiline'],
      '@stylistic/max-len': [
        'error',
        {
          code: 120,
          ignoreTrailingComments: true,
          ignoreUrls: true,
          ignoreRegExpLiterals: true,
          ignorePattern: '^import .*',
        },
      ],
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
    },
  },
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json')
  // skipFormatting,
)
