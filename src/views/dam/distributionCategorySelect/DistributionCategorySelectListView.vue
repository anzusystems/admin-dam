<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import DistributionCategorySelectDatatable
  from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectDatatable.vue'
import {
  useDistributionCategorySelectListActions
} from '@/views/dam/distributionCategorySelect/composables/distributionCategorySelectActions'

const { t } = useI18n()

const { listLoading } = useDistributionCategorySelectListActions()
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.distributionCategorySelect.meta.list')" />
  <ActionbarButtonsWrapper />
  <ACard :loading="listLoading">
    <DistributionCategorySelectDatatable />
  </ACard>
</template>
