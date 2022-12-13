<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import ExtSystemDatatable from '@/views/dam/extSystem/components/ExtSystemDatatable.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.extSystem.meta.list')" icon="mdi-folder-account-outline" />
  <ActionbarButtonsWrapper></ActionbarButtonsWrapper>
  <ACard loader="list">
    <ExtSystemDatatable></ExtSystemDatatable>
  </ACard>
</template>
