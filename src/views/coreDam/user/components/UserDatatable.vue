<script lang="ts" setup>
import { useUserListActions } from '@/views/coreDam/user/composables/userActions'
import { onMounted } from 'vue'
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
import { ENTITY } from '@/services/api/coreDam/userApi'
import { ROUTE } from '@/router/routes'
import type { User } from '@/types/coreDam/User'
import { useRouter } from 'vue-router'
import UserFilter from '@/views/coreDam/user/components/UserFilter.vue'
import { ACL, type AclValue } from '@/types/Permission'
import { useUserListFilter } from '@/model/coreDam/filter/UserFilter'

const router = useRouter()
const pagination = usePagination()
const filter = useUserListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useUserListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const columns = useDatatableColumns([{ name: 'email' }, { name: 'modifiedAt' }])

const { can } = useAcl<AclValue>()

const onRowClick = (row: User) => {
  if (row.id && can(ACL.DAM_USER_VIEW)) {
    router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: row.id } })
  }
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
  <UserFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </UserFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <Acl :permission="ACL.DAM_USER_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.USER.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_USER_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.USER.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
