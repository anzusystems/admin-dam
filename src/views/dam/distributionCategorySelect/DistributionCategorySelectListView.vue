<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import DistributionCategorySelectDatatable from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectDatatable.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.distributionCategorySelect.meta.list')" icon="mdi-form-down" />
  <ActionbarButtonsWrapper></ActionbarButtonsWrapper>
  <ACard loader="list">
    <DistributionCategorySelectDatatable></DistributionCategorySelectDatatable>
  </ACard>
</template>
