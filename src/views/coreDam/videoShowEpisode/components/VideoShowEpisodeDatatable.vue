<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ABooleanValue,
  ADatatableOrdering,
  type DatatableOrderingOption,
  type DatatableOrderingOptions,
  type DocId,
} from '@anzusystems/common-admin'
import {
  ADatatableConfigButton,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/videoShowEpisodeApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useVideoShowEpisodeListActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import { useVideoShowEpisodeListFilter } from '@/model/coreDam/filter/VideoShowEpisodeFilter'
import VideoShowEpisodeFilter from '@/views/coreDam/videoShowEpisode/components/VideoShowEpisodeFilter.vue'
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import { ACL, useAuth } from '@/composables/auth/auth'

type DatatableItem = VideoShowEpisode

const props = withDefaults(
  defineProps<{
    videoShowId: DocId
  }>(),
  {}
)

const router = useRouter()
const filter = useVideoShowEpisodeListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useVideoShowEpisodeListActions()

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_VIDEO_SHOW_EPISODE_READ)) {
    router.push({
      name: ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL,
      params: { id: props.videoShowId, episodeId: item.id },
    })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'texts.title' },
    { key: 'attributes.webOrderPosition' },
    { key: 'attributes.mobileOrderPosition' },
    { key: 'flags.webPublicExportEnabled' },
    { key: 'flags.mobilePublicExportEnabled' },
    { key: 'dates.publicationDate' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)
pagination.sortBy = 'position'

const customSort: DatatableOrderingOptions = [
  { id: 1, titleT: 'common.system.datatable.ordering.mostRecent', sortBy: { key: 'createdAt', order: 'desc' } },
  { id: 2, titleT: 'common.system.datatable.ordering.oldest', sortBy: { key: 'createdAt', order: 'asc' } },
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

const getList = () => {
  fetchList(props.videoShowId, pagination, filter)
}

onMounted(() => {
  fetchList(props.videoShowId, pagination, filter)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <VideoShowEpisodeFilter
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
        <template #item.dates.publicationDate="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.dates.publicationDate" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <ATableDetailButton
              :route-params="{ id: props.videoShowId, episodeId: item.id }"
              :route-name="ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL"
            />
            <ATableEditButton
              :route-params="{ id: props.videoShowId, episodeId: item.id }"
              :route-name="ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT"
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
