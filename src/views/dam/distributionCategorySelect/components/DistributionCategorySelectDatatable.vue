<script lang="ts" setup>
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionCategorySelectApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { ACL, type AclValue } from '@/types/Permission'
import { onMounted } from 'vue'
import { useDistributionCategorySelectListActions } from '@/views/dam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategorySelectListFilter } from '@/model/dam/filter/DistributionCategorySelectFilter'
import DistributionCategorySelectFilter from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectFilter.vue'
import { useAcl } from '@anzusystems/common-admin'

const router = useRouter()
const pagination = usePagination()
const filter = useDistributionCategorySelectListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useDistributionCategorySelectListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const columns = useTableColumns([{ name: 'serviceSlug' }, { name: 'createdAt' }, { name: 'modifiedAt' }])
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
          <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL" />
        </Acl>
        <ACopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
