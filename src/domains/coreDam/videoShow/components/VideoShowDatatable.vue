<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/videoShow/api/videoShowApi'
import {
  ABooleanValue,
  ADatatableConfigButton,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  type DatatableOrderingOption,
  type DatatableOrderingOptions,
} from '@anzusystems/common-admin'
import {
  ADatatableOrdering,
  ADatatablePagination,
  createDatatableColumnsConfig,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin/labs'
import { useDebounceFn } from '@vueuse/core'
import { useVideoShowListActions } from '@/domains/coreDam/videoShow/composables/videoShowActions'
import VideoShowFilter from '@/domains/coreDam/videoShow/components/VideoShowFilter.vue'
import { useVideoShowListFilter } from '@/domains/coreDam/videoShow/filter/VideoShowFilter'
import type { VideoShow } from '@/domains/coreDam/videoShow/types/VideoShow'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = VideoShow

const router = useRouter()

const { filterData, filterConfig } = useVideoShowListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useVideoShowListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig)

const { pagination, setSortBy } = usePagination('createdAt')
provide(DatatablePaginationKey, pagination)

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_VIDEO_SHOW_READ)) {
    router.push({ name: '/(coreDam)/video-shows/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'texts.title' },
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
  { id: 1, titleT: 'common.system.datatable.ordering.mostRecent', sortBy: { key: 'createdAt', order: 'desc' } },
  { id: 2, titleT: 'common.system.datatable.ordering.oldest', sortBy: { key: 'createdAt', order: 'asc' } },
  {
    id: 3,
    titleT: 'system.datatable.ordering.webOrderPosition',
    sortBy: { key: 'attributes.webOrderPosition', order: 'asc' },
  },
  {
    id: 4,
    titleT: 'system.datatable.ordering.mobileOrderPosition',
    sortBy: { key: 'attributes.mobileOrderPosition', order: 'asc' },
  },
]

const sortByChange = (option: DatatableOrderingOption) => {
  setSortBy(option.sortBy)
  filterConfig.touched = false
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
    <VideoShowFilter
      @submit="submitFilterAction"
      @reset="resetFilterAction"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <ADatatableOrdering
          :custom-options="customSort"
          @sort-by-change="sortByChange"
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
              :route-name="'/(coreDam)/video-shows/[id]'"
            />
            <ATableEditButton
              :record-id="item.id"
              :route-name="'/(coreDam)/video-shows/[id]/edit'"
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
