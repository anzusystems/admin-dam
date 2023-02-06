<script lang="ts" setup>
import { useUserListActions } from '@/views/dam/user/composables/userActions'
import { onMounted } from 'vue'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
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
import { ACL } from '@/types/Permission'
import { usePagination } from '@/composables/system/pagination'
import { useUserListFilter } from '@/model/dam/filter/UserFilter'

const router = useRouter()
const pagination = usePagination()
const filter = useUserListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useUserListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const columns = useTableColumns([
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
