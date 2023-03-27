<script lang="ts" setup>
import '@/styles/main.scss'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { inject, onMounted } from 'vue'
import { useWindowFilesDragWatcher } from '@/composables/system/windowFilesDragWatcher'
import {
  AvailableLanguagesSymbol,
  DefaultLanguageSymbol,
  type LanguageCode,
  modifyLanguageSettings,
} from '@anzusystems/common-admin'

const route = useRoute()
const configAvailableLanguages = inject<LanguageCode[]>(AvailableLanguagesSymbol, [])
const configDefaultLanguage = inject<LanguageCode>(DefaultLanguageSymbol, 'en')
const { initializeLanguage, addMessages, currentLanguageCode } = modifyLanguageSettings(
  configAvailableLanguages,
  configDefaultLanguage
)

const loadLanguageMessages = async (code: LanguageCode | 'default') => {
  if (code === 'default' || code === 'xx') return
  try {
    const messages = await import(`./locales/${code}.ts`)
    addMessages(code, messages.default)
  } catch (e) {
    console.error('Unable to load language translation messages.')
  }
}

onMounted(async () => {
  useWindowFilesDragWatcher()
  // initializeLanguage()
  // await loadLanguageMessages(currentLanguageCode.value)
})
</script>

<template>
  <AppLayout>
    <RouterView :key="route.path" />
  </AppLayout>
</template>
