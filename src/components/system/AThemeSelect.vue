<script lang="ts" setup>
import { ThemeSettings, useTheme } from '@/composables/system/themeSettings'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const { setThemeDark, setThemeAuto, setThemeLight, settings } = useTheme()

const { t } = useI18n({ useScope: 'global' })

const isOpen = ref(false)
</script>

<template>
  <VMenu v-model="isOpen" close-on-content-click>
    <template v-slot:activator="{ props }">
      <VBtn class="pl-1" rounded="pill" v-bind="props" variant="text" data-cy="settings-theme">
        <div v-if="settings === ThemeSettings.Auto">
          <VIcon class="mr-1" icon="mdi-brightness-auto" :size="32" />{{ t('system.theme.auto') }}
        </div>
        <div v-else-if="settings === ThemeSettings.Light">
          <VIcon class="mr-1" icon="mdi-brightness-7" :size="32" />{{ t('system.theme.light') }}
        </div>
        <div v-else-if="settings === ThemeSettings.Dark">
          <VIcon class="mr-1" icon="mdi-brightness-4" :size="32" />{{ t('system.theme.dark') }}
        </div>
      </VBtn>
    </template>
    <VCard>
      <VList dense>
        <VListItem :title="t('system.theme.auto')" @click.stop="setThemeAuto">
          <template v-slot:prepend>
            <VIcon class="mr-2" icon="mdi-brightness-auto" />
          </template>
        </VListItem>
        <VListItem :title="t('system.theme.light')" @click.stop="setThemeLight">
          <template v-slot:prepend>
            <VIcon class="mr-2" icon="mdi-brightness-7" />
          </template>
        </VListItem>
        <VListItem :title="t('system.theme.dark')" @click.stop="setThemeDark">
          <template v-slot:prepend>
            <VIcon class="mr-2" icon="mdi-brightness-4" />
          </template>
        </VListItem>
      </VList>
    </VCard>
  </VMenu>
</template>
