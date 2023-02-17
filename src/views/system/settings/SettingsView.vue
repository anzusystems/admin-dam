<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ALocaleSelect from '@/components/system/ALocaleSelect.vue'
import AToggleTheme from '@/components/system/AThemeSelect.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('sidebar.settings.settings')" icon="mdi-cog" />
  <VRow>
    <VCol cols="12">
      <ACard>
        <VRow align="center" class="pb-2">
          <VCol cols="1">{{ t('system.settings.locale') }}</VCol>
          <VCol>
            <ALocaleSelect />
          </VCol>
        </VRow>
        <VRow align="center" class="pb-2">
          <VCol cols="1">{{ t('system.settings.theme') }}</VCol>
          <VCol>
            <AToggleTheme />
          </VCol>
        </VRow>
      </ACard>
    </VCol>
  </VRow>
</template>
