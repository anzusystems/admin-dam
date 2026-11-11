<script lang="ts" setup>
import type { DatatableOrderingOption } from '@anzusystems/common-admin'
import { ADatatableOrdering } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import {
  customSortOptions,
  useAssetListActions,
} from '@/domains/coreDam/asset/components/list/composables/assetListActions'

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

// Like the dropdown: the ordering already in effect sends no request and keeps the loaded pages.
const onToggleClick = (option: DatatableOrderingOption) => {
  if (option.id === activeId.value) return
  onSortByChange(option)
}
</script>

<template>
  <div
    v-if="mdAndUp"
    class="d-flex align-center"
    data-cy="asset-sorting"
  >
    <div class="text-body-small mr-2">{{ t('common.system.datatable.ordering.title') }}:</div>
    <VBtn
      v-for="option in customSortOptions"
      :key="option.id"
      size="small"
      class="mr-1"
      :aria-pressed="option.id === activeId"
      :active="option.id === activeId"
      :color="option.id === activeId ? 'secondary' : ''"
      :variant="option.id === activeId ? 'flat' : 'text'"
      @click.stop="onToggleClick(option)"
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
