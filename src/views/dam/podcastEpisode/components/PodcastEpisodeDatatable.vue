<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/podcastEpisodeApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import type { Author } from '@/types/dam/Author'
import { usePodcastEpisodeListActions } from '@/views/dam/podcastEpisode/composables/podcastEpisodeActions'
import { usePodcastEpisodeListFilter } from '@/model/dam/filter/PodcastEpisodeFilter'
import PodcastEpisodeFilter from '@/views/dam/podcastEpisode/components/PodcastEpisodeFilter.vue'
import type { DocId } from '@anzusystems/common-admin'

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

const columns = useTableColumns([{ name: 'texts.title' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

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
  >
  </PodcastEpisodeFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST_EPISODE.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST_EPISODE.EDIT"></AEditButton>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
