<script lang="ts" setup>
import '@/styles/main.scss'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import { inject, onMounted } from 'vue'
import { useWindowFilesDragWatcher } from '@/composables/system/windowFilesDragWatcher'
import {
  type LanguageCode,
  AvailableLanguagesSymbol,
  DefaultLanguageSymbol,
  modifyLanguageSettings,
} from '@anzusystems/common-admin'
import { i18n } from '@/plugins/i18n'

const configAvailableLanguages = inject<LanguageCode[]>(AvailableLanguagesSymbol, [])
const configDefaultLanguage = inject<LanguageCode>(DefaultLanguageSymbol, 'en')
const route = useRoute()
const { initializeLanguage } = modifyLanguageSettings(i18n, configAvailableLanguages, configDefaultLanguage)

onMounted(() => {
  initializeLanguage()
  useWindowFilesDragWatcher()
})
</script>

<template>
  <AppLayout>
    <RouterView :key="route.path" />
  </AppLayout>
</template>
