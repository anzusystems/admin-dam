<script lang="ts" setup>
import { onMounted } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton, ATableEditButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/podcastEpisodeApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { usePodcastEpisodeListActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { usePodcastEpisodeListFilter } from '@/model/coreDam/filter/PodcastEpisodeFilter'
import PodcastEpisodeFilter from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeFilter.vue'
import { ACL } from '@/types/Permission'
import PodcastLastImportStatusChip from '@/views/coreDam/podcast/components/PodcastLastImportStatusChip.vue'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'

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

const onRowClick = (event: unknown, { item }: { item: { raw: PodcastEpisode } }) => {
  router.push({ name: ROUTE.DAM.PODCAST_EPISODE.DETAIL, params: { id: item.raw.id } })
}

const getList = () => {
  fetchList(props.podcastId, pagination, filter)
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'texts.title' }, { key: 'attributes.lastImportStatus' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)
pagination.sortBy = 'position'

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
        <ADatatableOrdering @sort-by-change="sortByChange" />
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
        <template #attributes.lastImportStatus="{ item }">
          <PodcastLastImportStatusChip :status="item.raw.attributes.lastImportStatu" />
        </template>
        <template #item.createdAt="{ item }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_PODCAST_EPISODE_VIEW">
              <ATableDetailButton
                :route-params="{ id: props.podcastId, episodeId: item.raw.id }"
                :route-name="ROUTE.DAM.PODCAST_EPISODE.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_PODCAST_EPISODE_UPDATE">
              <ATableEditButton
                :route-params="{ id: props.podcastId, episodeId: item.raw.id }"
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
