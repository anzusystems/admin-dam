<script lang="ts" setup>
import { ACard, useI18n } from '@anzusystems/common-admin'
import DistributionCategorySelectDatatable from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectDatatable.vue'
import { useDistributionCategorySelectListActions } from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { listLoading } = useDistributionCategorySelectListActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    {
      title: t('breadcrumb.coreDam.distributionCategorySelect.list'),
      routeName: '/(coreDam)/distribution-category-selects',
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs" />

  <ACard :loading="listLoading">
    <VCardText>
      <DistributionCategorySelectDatatable />
    </VCardText>
  </ACard>
</template>
