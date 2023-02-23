<script lang="ts" setup>
import { onMounted } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/podcastApi'
import { ATableDetailButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ATableCopyIdButton } from '@anzusystems/common-admin'
import { ATableEditButton } from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'
import type { Author } from '@/types/dam/Author'
import { usePodcastListActions } from '@/views/dam/podcast/composables/podcastActions'
import PodcastFilter from '@/views/dam/podcast/components/PodcastFilter.vue'
import { usePodcastListFilter } from '@/model/dam/filter/PodcastFilter'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  useFilterHelpers,
  usePagination,
  useTableColumns,
} from '@anzusystems/common-admin'

const router = useRouter()
const pagination = usePagination()
const filter = usePodcastListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = usePodcastListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useTableColumns([{ name: 'texts.title' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

const onRowClick = (row: Author) => {
  router.push({ name: ROUTE.DAM.PODCAST.DETAIL, params: { id: row.id } })
}

onMounted(() => {
  getList()
})

const refresh = () => {
  getList()
}

defineExpose({
  refresh,
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
        <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST.DETAIL" />
        <ATableCopyIdButton :id="data.id" />
        <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.PODCAST.EDIT" />
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
