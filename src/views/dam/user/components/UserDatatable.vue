<script lang="ts" setup>
import { useUserListActions } from '@/views/dam/user/composables/userActions'
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import { useUserRole } from '@/model/dam/valueObject/UserRole'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/userApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import type { User } from '@/types/dam/User'
import { useRouter } from 'vue-router'
import UserFilter from '@/views/dam/user/components/UserFilter.vue'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { useUserFilter } from '@/model/dam/filter/UserFilter'
import { ACL } from '@/types/Permission'

const router = useRouter()
const pagination = usePagination()
const filter = useUserFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useUserListActions()

const columns = useTableColumns([
  { name: 'id' },
  { name: 'email' },
  { name: 'firstName' },
  { name: 'lastName' },
  { name: 'roles' },
  { name: 'enabled' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: User) => {
  router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: row.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

onMounted(() => {
  fetchList(pagination, filter)
})

const { getUserRoleOption } = useUserRole()
</script>

<template>
  <UserFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </UserFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #roles="{ data }">
        <VChip v-for="role in data ?? []" :key="role" size="small">{{ getUserRoleOption(role)?.title }}</VChip>
      </template>
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.USER.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <Acl :permission="ACL.DAM_USER_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.USER.EDIT"></AEditButton>
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
