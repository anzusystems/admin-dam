<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useJobListFilter } from '@/model/coreDam/filter/JobFilter'
import { useJobListActions } from '@/views/coreDam/job/composables/jobActions'
import { ROUTE } from '@/router/routes'
import type { Job } from '@/types/coreDam/Job'
import { onMounted } from 'vue'
import JobFilter from '@/views/coreDam/job/components/JobFilter.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  ATableCopyIdButton,
  ATableDetailButton,
  JobStatusChip,
  useAcl,
  useDatatableColumns,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import JobResourceChip from '@/views/coreDam/job/components/JobResourceChip.vue'
import { useI18n } from 'vue-i18n'
import { ACL, type AclValue } from '@/types/Permission'

const router = useRouter()
const pagination = usePagination()
const filter = useJobListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useJobListActions()

const { t } = useI18n()

const columns = useDatatableColumns([
  { name: 'id', label: t('common.job.model.id') },
  { name: '_resourceName', label: t('common.job.model._resourceName') },
  { name: 'status', label: t('common.job.model.status') },
  { name: 'startedAt', label: t('common.job.model.startedAt'), type: 'datetime' },
  { name: 'finishedAt', label: t('common.job.model.finishedAt'), type: 'datetime' },
  { name: 'result', label: t('common.job.model.result') },
  { name: 'createdAt', label: t('common.model.tracking.created') },
])

const { can } = useAcl<AclValue>()

const onRowClick = (row: Job) => {
  if (row.id && can(ACL.DAM_JOB_VIEW)) {
    router.push({ name: ROUTE.DAM.JOB.DETAIL, params: { id: row.id } })
  }
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
        <Acl :permission="ACL.DAM_JOB_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.JOB.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
