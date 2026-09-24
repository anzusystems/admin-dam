<script lang="ts" setup>
import {
  ABooleanValue,
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  SortOrder,
  createDatatableColumnsConfig,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import type { DatatableOrderingOption, DatatableOrderingOptions, Pagination } from '@anzusystems/common-admin'
import { useDebounceFn } from '@vueuse/core'
import type { Ref } from 'vue'
import { onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'

import { ENTITY } from '@/domains/coreDam/podcast/api/podcastApi'
import PodcastFilter from '@/domains/coreDam/podcast/components/PodcastFilter.vue'
import PodcastLastImportStatusChip from '@/domains/coreDam/podcast/components/PodcastLastImportStatusChip.vue'
import { usePodcastListActions } from '@/domains/coreDam/podcast/composables/podcastActions'
import { usePodcastListFilter } from '@/domains/coreDam/podcast/filter/PodcastFilter'
import type { Podcast } from '@/domains/coreDam/podcast/types/Podcast'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

type DatatableItem = Podcast

const router = useRouter()

const { filterData, filterConfig } = usePodcastListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = usePodcastListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig, {
  populateUrlParams: false,
  storeFiltersLocalStorage: false,
})

const { pagination } = usePagination('createdAt')
provide(DatatablePaginationKey, pagination)

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id) {
    router.push({ name: '/(coreDam)/podcasts/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'texts.title' },
    { key: 'attributes.lastImportStatus' },
    { key: 'attributes.webOrderPosition' },
    { key: 'attributes.mobileOrderPosition' },
    { key: 'flags.webPublicExportEnabled' },
    { key: 'flags.mobilePublicExportEnabled' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const getList = useDebounceFn(() => {
  fetchList(pagination, filterData, filterConfig)
})

const customSort: DatatableOrderingOptions = [
  { id: 1, titleT: 'common.system.datatable.ordering.mostRecent', sortBy: { key: 'createdAt', order: SortOrder.Desc } },
  { id: 2, titleT: 'common.system.datatable.ordering.oldest', sortBy: { key: 'createdAt', order: SortOrder.Asc } },
  {
    id: 3,
    titleT: 'system.datatable.ordering.webOrderPosition',
    sortBy: { key: 'attributes.webOrderPosition', order: SortOrder.Asc },
  },
  {
    id: 4,
    titleT: 'system.datatable.ordering.mobileOrderPosition',
    sortBy: { key: 'attributes.mobileOrderPosition', order: SortOrder.Asc },
  },
]

const paginationUpdateCustomCb = (option: DatatableOrderingOption, paginationRef: Ref<Pagination>) => {
  paginationRef.value.sortBy = option.sortBy ?? null
  submitFilter(pagination, getList)
}

const submitFilterAction = () => {
  submitFilter(pagination, getList)
}

const resetFilterAction = () => {
  resetFilter(pagination, getList)
}

onMounted(() => {
  loadStoredFilters(pagination, getList)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <PodcastFilter
      @submit="submitFilterAction"
      @reset="resetFilterAction"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <ADatatableOrdering
          :custom-options="customSort"
          :pagination-update-custom-cb="paginationUpdateCustomCb"
        />
        <ADatatableConfigButton
          v-model:columns-hidden="columnsHidden"
          :columns-all="columnsAll"
        />
      </div>
      <VDataTableServer
        class="a-datatable"
        :headers="columnsVisible"
        :items="listItems"
        :items-length="listItems.length"
        item-value="id"
        @click:row="onRowClick"
      >
        <template #item.attributes.lastImportStatus="{ item }: { item: DatatableItem }">
          <PodcastLastImportStatusChip :status="item.attributes.lastImportStatus" />
        </template>
        <template #item.flags.webPublicExportEnabled="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.flags.webPublicExportEnabled"
          />
        </template>
        <template #item.flags.mobilePublicExportEnabled="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.flags.mobilePublicExportEnabled"
          />
        </template>
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <ATableDetailButton
              :record-id="item.id"
              :route-name="'/(coreDam)/podcasts/[id]'"
            />
            <ATableEditButton
              :record-id="item.id"
              :route-name="'/(coreDam)/podcasts/[id]/edit'"
            />
          </div>
        </template>
        <template #bottom>
          <ADatatablePagination
            v-model="pagination"
            @change="getList"
          />
        </template>
      </VDataTableServer>
    </div>
  </div>
</template>
