<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { AThemeSelect, ALanguageSelect } from '@anzusystems/common-admin'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('sidebar.settings.settings')" />
  <VRow>
    <VCol cols="12">
      <ACard>
        <VRow align="center" class="pb-2">
          <VCol cols="1">{{ t('system.settings.locale') }}</VCol>
          <VCol>
            <ALanguageSelect />
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
