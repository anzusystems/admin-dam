<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useJobListFilter } from '@/model/dam/filter/JobFilter'
import { useJobListActions } from '@/views/dam/job/composables/jobActions'
import { ROUTE } from '@/router/routes'
import type { Job } from '@/types/dam/Job'
import { onMounted } from 'vue'
import JobFilter from '@/views/dam/job/components/JobFilter.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  JobStatusChip,
  useFilterHelpers,
  usePagination,
  useDatatableColumns,
} from '@anzusystems/common-admin'
import JobResourceChip from '@/views/dam/job/components/JobResourceChip.vue'
import { ATableDetailButton } from '@anzusystems/common-admin'
import { ATableCopyIdButton } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const pagination = usePagination()
const filter = useJobListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useJobListActions()

const { t } = useI18n()

const columns = useDatatableColumns([
  { name: 'id', label: t('job.model.id') },
  { name: '_resourceName', label: t('job.model._resourceName') },
  { name: 'status', label: t('job.model.status') },
  { name: 'startedAt', label: t('job.model.startedAt') },
  { name: 'finishedAt', label: t('job.model.finishedAt') },
  { name: 'result', label: t('job.model.result') },
  { name: 'createdAt', label: t('job.model.createdAt') },
])

const onRowClick = (row: Job) => {
  router.push({ name: ROUTE.DAM.JOB.DETAIL, params: { id: row.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

onMounted(() => {
  fetchList(pagination, filter)
})

const refresh = () => {
  getList()
}

defineExpose({
  refresh,
})
</script>

<template>
  <JobFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </JobFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" subject="job">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #_resourceName="{ data }">
        <JobResourceChip :value="data"></JobResourceChip>
      </template>
      <template #status="{ data }">
        <JobStatusChip :value="data"></JobStatusChip>
      </template>
      <template #actions="{ data }">
        <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.JOB.DETAIL" />
        <ATableCopyIdButton :id="data.id" />
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
