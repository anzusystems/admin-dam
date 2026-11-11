<script lang="ts" setup>
import {
  customSortOptions,
  useAssetListActions,
} from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import type { DatatableOrderingOption } from '@anzusystems/common-admin'
import { ADatatableOrdering } from '@anzusystems/common-admin/labs'
import { useDisplay } from 'vuetify'

const { t } = useI18n()
const { mdAndUp } = useDisplay()
const { pagination, fetchAssetList } = useAssetListActions()

const activeId = computed<number>(() => {
  const found = customSortOptions.find(
    (option) =>
      option.sortBy.key === pagination.value.sortBy?.key && option.sortBy.order === pagination.value.sortBy?.order
  )
  return found?.id ?? customSortOptions[0].id
})

const onSortByChange = (option: DatatableOrderingOption) => {
  if (!option.sortBy) return
  pagination.value.sortBy = option.sortBy
  fetchAssetList()
}
</script>

<template>
  <div
    v-if="mdAndUp"
    class="d-flex align-center"
    data-cy="asset-sorting"
  >
    <div class="text-body-small mr-2">
      {{ t('common.system.datatable.ordering.title') }}:
    </div>
    <VBtn
      v-for="option in customSortOptions"
      :key="option.id"
      size="small"
      class="mr-1"
      :active="option.id === activeId"
      :color="option.id === activeId ? 'secondary' : ''"
      :variant="option.id === activeId ? 'flat' : 'text'"
      @click.stop="onSortByChange(option)"
    >
      {{ t(option.titleT) }}
    </VBtn>
  </div>
  <ADatatableOrdering
    v-else
    :model-value="activeId"
    :custom-options="customSortOptions"
    @sort-by-change="onSortByChange"
  />
</template>
