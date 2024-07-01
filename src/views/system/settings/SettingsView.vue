<script lang="ts" setup>
import {
  ALanguageSelect,
  AThemeSelect,
  AvailableLanguagesSymbol,
  DefaultLanguageSymbol,
  type LanguageCode,
  modifyLanguageSettings,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { inject } from 'vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'

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
  <ActionbarWrapper />

  <VCard>
    <VCardText>
      <VRow>
        <VCol cols="12">
          <VRow
            align="center"
            class="pb-2"
          >
            <VCol cols="1">
              {{ t('system.settings.locale') }}
            </VCol>
            <VCol>
              <ALanguageSelect
                :system="SYSTEM_CORE_DAM"
                @after-change="afterLanguageChange"
              />
            </VCol>
          </VRow>
          <VRow
            align="center"
            class="pb-2"
          >
            <VCol cols="1">
              {{ t('system.settings.theme') }}
            </VCol>
            <VCol>
              <AThemeSelect />
            </VCol>
          </VRow>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
