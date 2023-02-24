<script lang="ts" setup>
import { useUserListActions } from '@/views/dam/user/composables/userActions'
import { onMounted } from 'vue'
import { ADatatablePagination } from '@anzusystems/common-admin'
import { useDatatableColumns } from '@anzusystems/common-admin'
import { ADatatable } from '@anzusystems/common-admin'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/userApi'
import { ATableDetailButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ATableCopyIdButton } from '@anzusystems/common-admin'
import { ATableEditButton } from '@anzusystems/common-admin'
import type { User } from '@/types/dam/User'
import { useRouter } from 'vue-router'
import UserFilter from '@/views/dam/user/components/UserFilter.vue'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { ACL } from '@/types/Permission'
import { usePagination } from '@anzusystems/common-admin'
import { useUserListFilter } from '@/model/dam/filter/UserFilter'

const router = useRouter()
const pagination = usePagination()
const filter = useUserListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useUserListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const columns = useDatatableColumns([
  { name: 'email' },
  { name: 'firstName' },
  { name: 'lastName' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: User) => {
  router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: row.id } })
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
        <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.USER.DETAIL" />
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_USER_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.USER.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
