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

const configAvailableLanguages = inject<LanguageCode[]>(AvailableLanguagesSymbol, [])
const configDefaultLanguage = inject<LanguageCode>(DefaultLanguageSymbol, 'en')
const route = useRoute()
const { initializeLanguage } = modifyLanguageSettings(configAvailableLanguages, configDefaultLanguage)

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
