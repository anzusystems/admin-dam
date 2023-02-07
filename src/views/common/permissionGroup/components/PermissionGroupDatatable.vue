<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { ENTITY } from '@/services/api/common/permissionGroupApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { ACL } from '@/types/Permission'
import type { AxiosInstance } from 'axios'
import { usePermissionGroupListFilter } from '@/model/common/filter/PermissionGroupFilter'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import type { PermissionGroup } from '@anzusystems/common-admin'
import PermissionGroupFilter from '@/views/common/permissionGroup/components/PermissionGroupFilter.vue'

const props = defineProps<{
  client: () => AxiosInstance
}>()

const router = useRouter()

const pagination = usePagination()
const filter = usePermissionGroupListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchPermissionGroupList, permissionGroupList, loadingPermissionGroupList } = usePermissionGroupActions(
  props.client
)

const onRowClick = (row: PermissionGroup) => {
  if (row.id) {
    router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.DETAIL, params: { id: row.id } })
  }
}

const getList = () => {
  fetchPermissionGroupList(pagination, filter)
}

const columns = useTableColumns([
  { name: 'id' },
  { name: 'title' },
  { name: 'description' },
  { name: 'permissions' },
  { name: 'modifiedAt' },
])

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
  <VCard :loading="loadingPermissionGroupList" variant="flat">
    <VCardText>
      <div>
        <PermissionGroupFilter
          @submit-filter="submitFilter(filter, pagination, getList)"
          @reset-filter="resetFilter(filter, pagination, getList)"
        />
        <ASystemEntityScope system="common" :subject="ENTITY">
          <ADatatable :data="permissionGroupList" :columns="columns" @row-click="onRowClick">
            <template #permissions="{ data }">
              <VChip>{{ Object.keys(data).length }}</VChip>
            </template>
            <template #actions="{ data }">
              <ADetailButton :record-id="data.id" :route-name="ROUTE.COMMON.PERMISSION_GROUP.DETAIL" />
              <ACopyIdButton :id="data.id" />
              <Acl :permission="ACL.DAM_PERMISSION_GROUP_UPDATE">
                <AEditButton :record-id="data.id" :route-name="ROUTE.COMMON.PERMISSION_GROUP.EDIT" />
              </Acl>
            </template>
          </ADatatable>
          <ADatatablePagination v-model="pagination" @change="getList" />
        </ASystemEntityScope>
      </div>
    </VCardText>
  </VCard>
</template>
