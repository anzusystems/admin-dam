<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ABooleanValue,
  ADatatable,
  ADatatablePagination,
  type AnzuUser,
  ASystemEntityScope,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  useDatatableColumns,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/common/anzuUserApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import type { AxiosInstance } from 'axios'
import { useAnzuUserFilter } from '@/model/common/filter/AnzuUserFilter'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserFilter from '@/views/common/anzuUser/components/AnzuUserFilter.vue'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'
import PermissionGroupLazyChip from '@/views/common/permissionGroup/components/PermissionGroupLazyChip.vue'
import { useAcl } from '@anzusystems/common-admin'

const props = defineProps<{
  client: () => AxiosInstance
}>()

const router = useRouter()

const pagination = usePagination()
const filter = useAnzuUserFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchAnzuUserList, anzuUserList, loadingAnzuUserList } = useAnzuUserActions(props.client)
const { can } = useAcl<AclValue>()

const onRowClick = (row: AnzuUser) => {
  if (row.id && can(ACL.DAM_USER_VIEW)) {
    router.push({ name: ROUTE.COMMON.ANZU_USER.DETAIL, params: { id: row.id } })
  }
}

const getList = () => {
  fetchAnzuUserList(pagination, filter)
}

onMounted(() => {
  getList()
})

const columns = useDatatableColumns([
  { name: 'id' },
  { name: 'email' },
  { name: 'enabled' },
  { name: 'roles' },
  { name: 'permissionGroups' },
  { name: 'permissions' },
  { name: 'modifiedAt' },
])

const refresh = () => {
  getList()
}

defineExpose({
  refresh,
})
const { translatePermission } = usePermissionConfigActions(props.client)
</script>

<template>
  <VCard :loading="loadingAnzuUserList" variant="flat">
    <VCardText>
      <div>
        <AnzuUserFilter
          @submit-filter="submitFilter(filter, pagination, getList)"
          @reset-filter="resetFilter(filter, pagination, getList)"
        />
        <ASystemEntityScope system="common" :subject="ENTITY">
          <ADatatable :data="anzuUserList" :columns="columns" @row-click="onRowClick">
            <template #enabled="{ data }">
              <ABooleanValue chip :value="data" />
            </template>
            <template #roles="{ data }">
              <VChip v-for="role in data" :key="role" class="mr-1 mb-1">{{ translatePermission('roles', role) }}</VChip>
              <span v-if="data.length === 0">-</span>
            </template>
            <template #permissionGroups="{ data }">
              <PermissionGroupLazyChip
                v-for="permissionGroupId in data"
                :id="permissionGroupId"
                :key="permissionGroupId"
                class="mr-1 mb-1"
              />
              <span v-if="data.length === 0">-</span>
            </template>
            <template #permissions="{ data }">
              <VChip>{{ Object.keys(data).length }}</VChip>
            </template>
            <template #actions="{ data }">
              <Acl :permission="ACL.DAM_USER_VIEW">
                <ATableDetailButton :record-id="data.id" :route-name="ROUTE.COMMON.ANZU_USER.DETAIL" />
              </Acl>
              <ATableCopyIdButton :id="data.id" />
              <Acl :permission="ACL.DAM_USER_UPDATE">
                <ATableEditButton :record-id="data.id" :route-name="ROUTE.COMMON.ANZU_USER.EDIT" />
              </Acl>
            </template>
          </ADatatable>
          <ADatatablePagination v-model="pagination" @change="getList" />
        </ASystemEntityScope>
      </div>
    </VCardText>
  </VCard>
</template>
