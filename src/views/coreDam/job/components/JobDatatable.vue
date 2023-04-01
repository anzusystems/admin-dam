<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { useJobListFilter } from '@/model/coreDam/filter/JobFilter'
import { useJobListActions } from '@/views/coreDam/job/composables/jobActions'
import { ROUTE } from '@/router/routes'
import { onMounted } from 'vue'
import JobFilter from '@/views/coreDam/job/components/JobFilter.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  AJobStatusChip,
  ATableCopyIdButton,
  ATableDetailButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import JobResourceChip from '@/views/coreDam/job/components/JobResourceChip.vue'
import { useI18n } from 'vue-i18n'
import { ACL, type AclValue } from '@/types/Permission'
import { ENTITY } from '@/services/api/coreDam/podcastApi'
import type { Job } from '@/types/coreDam/Job'

type DatatableItem = { raw: Job }

const router = useRouter()
const filter = useJobListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useJobListActions()

const { t } = useI18n()

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.raw.id && can(ACL.DAM_JOB_VIEW)) {
    router.push({ name: ROUTE.DAM.JOB.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id', title: t('common.job.model.id') },
    { key: '_resourceName', title: t('common.job.model._resourceName') },
    { key: 'status', title: t('common.job.model.status') },
    { key: 'startedAt', title: t('common.job.model.startedAt') },
    { key: 'finishedAt', title: t('common.job.model.finishedAt') },
    { key: 'result', title: t('common.job.model.result') },
    { key: 'createdAt', title: t('common.model.tracking.created') },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const getList = () => {
  fetchList(pagination, filter)
}

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

onMounted(() => {
  fetchList(pagination, filter)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <JobFilter
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
        <template #item._resourceName="{ item }: { item: DatatableItem }">
          <JobResourceChip :value="item.raw._resourceName" />
        </template>
        <template #item.status="{ item }: { item: DatatableItem }">
          <AJobStatusChip :value="item.raw.status" />
        </template>
        <template #item.startedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.startedAt" />
        </template>
        <template #item.finishedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.finishedAt" />
        </template>
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_JOB_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.JOB.DETAIL"
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
