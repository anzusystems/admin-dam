<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/podcastApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import type { Author } from '@/types/dam/Author'
import { usePodcastListActions } from '@/views/dam/podcast/composables/podcastActions'
import { usePodcastFilter } from '@/model/dam/filter/PodcastFilter'
import PodcastFilter from '@/views/dam/podcast/components/PodcastFilter.vue'

const router = useRouter()
const pagination = usePagination()
const filter = usePodcastFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = usePodcastListActions()

const columns = useTableColumns([
  { name: 'texts.title' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: Author) => {
  router.push({ name: ROUTE.DAM.PODCAST.DETAIL, params: { id: row.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

onMounted(() => {
  fetchList(pagination, filter)
})
</script>

<template>
  <PodcastFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </PodcastFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST.EDIT"></AEditButton>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
