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

const onToggle = (id: number) => {
  const option = customSortOptions.find((item) => item.id === id)
  if (option && option.id !== activeId.value) onSortByChange(option)
}
</script>

<template>
  <div
    v-if="mdAndUp"
    class="d-flex align-center"
  >
    <div class="text-body-small mr-2">
      {{ t('common.system.datatable.ordering.title') }}:
    </div>
    <VBtnToggle
      :model-value="activeId"
      density="compact"
      mandatory
      data-cy="asset-sorting"
      @update:model-value="onToggle"
    >
      <VBtn
        v-for="option in customSortOptions"
        :key="option.id"
        :value="option.id"
        :color="option.id === activeId ? 'secondary' : ''"
        size="small"
        density="compact"
      >
        {{ t(option.titleT) }}
      </VBtn>
    </VBtnToggle>
  </div>
  <ADatatableOrdering
    v-else
    :model-value="activeId"
    :custom-options="customSortOptions"
    @sort-by-change="onSortByChange"
  />
</template>
