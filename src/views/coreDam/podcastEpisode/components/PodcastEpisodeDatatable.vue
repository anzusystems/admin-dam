<script lang="ts" setup>
import { onMounted } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  useDatatableColumns,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/podcastEpisodeApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { Author } from '@/types/coreDam/Author'
import { usePodcastEpisodeListActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { usePodcastEpisodeListFilter } from '@/model/coreDam/filter/PodcastEpisodeFilter'
import PodcastEpisodeFilter from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeFilter.vue'
import { ACL } from '@/types/Permission'

const props = withDefaults(
  defineProps<{
    podcastId: DocId
  }>(),
  {}
)

const router = useRouter()
const pagination = usePagination()
pagination.sortBy = 'position'
const filter = usePodcastEpisodeListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = usePodcastEpisodeListActions()

const columns = useDatatableColumns([{ name: 'texts.title' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

const onRowClick = (row: Author) => {
  router.push({ name: ROUTE.DAM.PODCAST_EPISODE.DETAIL, params: { id: row.id } })
}

const getList = () => {
  fetchList(props.podcastId, pagination, filter)
}

onMounted(() => {
  fetchList(props.podcastId, pagination, filter)
})
</script>

<template>
  <PodcastEpisodeFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  />
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <Acl :permission="ACL.DAM_PODCAST_EPISODE_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST_EPISODE.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_PODCAST_EPISODE_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST_EPISODE.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
