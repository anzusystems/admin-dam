<script lang="ts" setup>
import { onMounted } from 'vue'
import { ABooleanValue, ADatatableOrdering, type DatatableOrderingOption, type DocId } from '@anzusystems/common-admin'
import {
  ADatatableConfigButton,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  useFilterHelpers,
  type DatatableOrderingOptions,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/podcastEpisodeApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { usePodcastEpisodeListActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { usePodcastEpisodeListFilter } from '@/model/coreDam/filter/PodcastEpisodeFilter'
import PodcastEpisodeFilter from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeFilter.vue'
import PodcastLastImportStatusChip from '@/views/coreDam/podcast/components/PodcastLastImportStatusChip.vue'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import { ACL } from '@/composables/auth/auth'
import { prettyDuration } from '@/utils/file'

type DatatableItem = PodcastEpisode

const props = withDefaults(
  defineProps<{
    podcastId: DocId
  }>(),
  {}
)

const router = useRouter()
const filter = usePodcastEpisodeListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = usePodcastEpisodeListActions()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  router.push({ name: ROUTE.DAM.PODCAST_EPISODE.DETAIL, params: { id: props.podcastId, episodeId: item.id } })
}

const getList = () => {
  fetchList(props.podcastId, pagination, filter)
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
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
  { id: 1, titleT: 'common.system.datatable.ordering.mostRecent', sortBy: { key: 'id', order: 'desc' } },
  { id: 2, titleT: 'common.system.datatable.ordering.oldest', sortBy: { key: 'id', order: 'asc' } },
  {
    id: 3,
    titleT: 'system.datatable.ordering.webOrderPosition',
    sortBy: { key: 'attributes.webOrderPosition', order: 'desc' },
  },
  {
    id: 4,
    titleT: 'system.datatable.ordering.mobileOrderPosition',
    sortBy: { key: 'attributes.mobileOrderPosition', order: 'desc' },
  },
]

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

onMounted(() => {
  fetchList(props.podcastId, pagination, filter)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <PodcastEpisodeFilter
      @submit-filter="submitFilter(filter, pagination, getList)"
      @reset-filter="resetFilter(filter, pagination, getList)"
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
                :route-name="ROUTE.DAM.PODCAST_EPISODE.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_PODCAST_EPISODE_UPDATE">
              <ATableEditButton
                :route-params="{ id: props.podcastId, episodeId: item.id }"
                :route-name="ROUTE.DAM.PODCAST_EPISODE.EDIT"
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
