<script lang="ts" setup>
import { onMounted } from 'vue'
import type { PermissionGroup } from '@anzusystems/common-admin'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  useDatatableColumns,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/common/permissionGroupApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL } from '@/types/Permission'
import type { AxiosInstance } from 'axios'
import { usePermissionGroupListFilter } from '@/model/common/filter/PermissionGroupFilter'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
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

const columns = useDatatableColumns([
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
              <ATableDetailButton :record-id="data.id" :route-name="ROUTE.COMMON.PERMISSION_GROUP.DETAIL" />
              <ATableCopyIdButton :id="data.id" />
              <Acl :permission="ACL.DAM_PERMISSION_GROUP_UPDATE">
                <ATableEditButton :record-id="data.id" :route-name="ROUTE.COMMON.PERMISSION_GROUP.EDIT" />
              </Acl>
            </template>
          </ADatatable>
          <ADatatablePagination v-model="pagination" @change="getList" />
        </ASystemEntityScope>
      </div>
    </VCardText>
  </VCard>
</template>
