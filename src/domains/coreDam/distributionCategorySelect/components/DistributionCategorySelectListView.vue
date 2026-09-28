<script lang="ts" setup>
import { ACard, defineBreadcrumbs } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DistributionCategorySelectDatatable from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectDatatable.vue'
import { useDistributionCategorySelectListActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
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
