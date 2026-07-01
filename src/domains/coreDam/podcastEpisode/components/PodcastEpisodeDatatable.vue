<script lang="ts" setup>
import {
  ABooleanValue,
  ADatatableConfigButton,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  type DatatableOrderingOption,
  type DatatableOrderingOptions,
  SortOrder,
} from '@anzusystems/common-admin'
import {
  ADatatableOrdering,
  ADatatablePagination,
  createDatatableColumnsConfig,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  type Pagination,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin/labs'
import type { Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/podcastEpisode/api/podcastEpisodeApi'
import { usePodcastEpisodeListActions } from '@/domains/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { usePodcastEpisodeListFilter } from '@/domains/coreDam/podcastEpisode/filter/PodcastEpisodeFilter'
import PodcastEpisodeFilter from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeFilter.vue'
import PodcastLastImportStatusChip from '@/domains/coreDam/podcast/components/PodcastLastImportStatusChip.vue'
import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'
import { ACL } from '@/domains/system/auth/auth'
import { prettyDuration } from '@/shared/utils/file'

type DatatableItem = PodcastEpisode

const props = withDefaults(
  defineProps<{
    podcastId: DocId
  }>(),
  {}
)

const router = useRouter()

const { filterData, filterConfig } = usePodcastEpisodeListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = usePodcastEpisodeListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig)

const { pagination } = usePagination('id')
provide(DatatablePaginationKey, pagination)

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  router.push({
    name: '/(coreDam)/podcasts/[id]/episodes/[episodeId]',
    params: { id: props.podcastId, episodeId: item.id },
  })
}

const getList = useDebounceFn(() => {
  fetchList(props.podcastId, pagination, filterData, filterConfig)
})

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'texts.title' },
    { key: 'attributes.lastImportStatus' },
    { key: 'attributes.webOrderPosition' },
    { key: 'attributes.mobileOrderPosition' },
    { key: 'flags.webPublicExportEnabled' },
    { key: 'flags.mobilePublicExportEnabled' },
    { key: 'attributes.duration' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const customSort: DatatableOrderingOptions = [
  { id: 1, titleT: 'common.system.datatable.ordering.mostRecent', sortBy: { key: 'id', order: SortOrder.Desc } },
  { id: 2, titleT: 'common.system.datatable.ordering.oldest', sortBy: { key: 'id', order: SortOrder.Asc } },
  {
    id: 3,
    titleT: 'system.datatable.ordering.webOrderPosition',
    sortBy: { key: 'attributes.webOrderPosition', order: SortOrder.Desc },
  },
  {
    id: 4,
    titleT: 'system.datatable.ordering.mobileOrderPosition',
    sortBy: { key: 'attributes.mobileOrderPosition', order: SortOrder.Desc },
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
    <PodcastEpisodeFilter
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
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.modifiedAt" />
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
        <template #item.attributes.duration="{ item }: { item: DatatableItem }">
          <template v-if="item.attributes.duration">
            {{ prettyDuration(item.attributes.duration) }}
          </template>
          <template v-else>
            -
          </template>
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <Acl :permission="ACL.DAM_PODCAST_EPISODE_READ">
              <ATableDetailButton
                :route-params="{ id: props.podcastId, episodeId: item.id }"
                :route-name="'/(coreDam)/podcasts/[id]/episodes/[episodeId]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_PODCAST_EPISODE_UPDATE">
              <ATableEditButton
                :route-params="{ id: props.podcastId, episodeId: item.id }"
                :route-name="'/(coreDam)/podcasts/[id]/episodes/[episodeId]/edit'"
              />
            </Acl>
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
