<script lang="ts" setup>
import {
  ACard,
  ALanguageSelect,
  AThemeSelect,
  AvailableLanguagesSymbol,
  DefaultLanguageSymbol,
  LanguageCode,
  modifyLanguageSettings,
} from '@anzusystems/common-admin'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useI18n } from 'vue-i18n'
import { inject } from 'vue'

const { t } = useI18n()
const configAvailableLanguages = inject<LanguageCode[]>(AvailableLanguagesSymbol, [])
const configDefaultLanguage = inject<LanguageCode>(DefaultLanguageSymbol, 'en')
const { addMessages } = modifyLanguageSettings(configAvailableLanguages, configDefaultLanguage)

const loadLanguageMessages = async (code: LanguageCode | 'default') => {
  if (code === 'default' || code === 'xx') return
  try {
    const messages = await import(`../../../locales/${code}.ts`)
    addMessages(code, messages.default)
  } catch (e) {
    console.error('Unable to load language translation messages.')
  }
}

const afterLanguageChange = async (language: LanguageCode) => {
  await loadLanguageMessages(language)
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('sidebar.settings.settings')" />
  <VRow>
    <VCol cols="12">
      <ACard>
        <VRow align="center" class="pb-2">
          <VCol cols="1">{{ t('system.settings.locale') }}</VCol>
          <VCol>
            <ALanguageSelect @after-change="afterLanguageChange" />
          </VCol>
        </VRow>
        <VRow align="center" class="pb-2">
          <VCol cols="1">{{ t('system.settings.theme') }}</VCol>
          <VCol>
            <AThemeSelect />
          </VCol>
        </VRow>
      </ACard>
    </VCol>
  </VRow>
</template>
