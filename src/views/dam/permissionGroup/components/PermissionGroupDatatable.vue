<script lang="ts" setup>
import { onMounted } from 'vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/permissionGroupApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import type { PermissionGroup } from '@/types/dam/PermissionGroup'
import { usePermissionGroupListActions } from '@/views/dam/permissionGroup/composables/permissionGroupActions'
import PermissionGroupFilter from '@/views/dam/permissionGroup/components/PermissionGroupFilter.vue'
import { ACL } from '@/types/Permission'
import { usePagination } from '@/composables/system/pagination'
import { usePermissionGroupListFilter } from '@/model/dam/filter/PermissionGroupFilter'

const router = useRouter()
const pagination = usePagination()
const filter = usePermissionGroupListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = usePermissionGroupListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useTableColumns([
  { name: 'title' },
  { name: 'description' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: PermissionGroup) => {
  router.push({ name: ROUTE.DAM.PERMISSION_GROUP.DETAIL, params: { id: row.id } })
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
  <PermissionGroupFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </PermissionGroupFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.PERMISSION_GROUP.DETAIL" />
        <ACopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_PERMISSION_GROUP_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.PERMISSION_GROUP.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
