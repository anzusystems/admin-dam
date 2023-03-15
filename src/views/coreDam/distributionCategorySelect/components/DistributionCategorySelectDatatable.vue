<script lang="ts" setup>
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  useAcl,
  useDatatableColumns,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'
import { ACL, type AclValue } from '@/types/Permission'
import { onMounted } from 'vue'
import { useDistributionCategorySelectListActions } from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategorySelectListFilter } from '@/model/coreDam/filter/DistributionCategorySelectFilter'
import DistributionCategorySelectFilter from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectFilter.vue'

const router = useRouter()
const pagination = usePagination()
const filter = useDistributionCategorySelectListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useDistributionCategorySelectListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const columns = useDatatableColumns([{ name: 'serviceSlug' }, { name: 'createdAt' }, { name: 'modifiedAt' }])
const { can } = useAcl<AclValue>()

const onRowClick = (row: ExtSystem) => {
  if (row.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW)) {
    router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL, params: { id: row.id } })
  }
}

onMounted(() => getList())
</script>

<template>
  <DistributionCategorySelectFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </DistributionCategorySelectFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
