<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/extSystemApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { useExtSystemFilter } from '@/model/dam/filter/ExtSystemFilter'
import { useExtSystemListActions } from '@/views/dam/extSystem/composables/extSystemActions'
import ExtSystemFilter from '@/views/dam/extSystem/components/ExtSystemFilter.vue'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { ACL } from '@/types/Permission'

const router = useRouter()
const pagination = usePagination()
const filter = useExtSystemFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useExtSystemListActions()

const columns = useTableColumns([{ name: 'name' }, { name: 'slug' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

const onRowClick = (row: ExtSystem) => {
  router.push({ name: ROUTE.DAM.EXT_SYSTEM.DETAIL, params: { id: row.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

onMounted(() => {
  fetchList(pagination, filter)
})
</script>

<template>
  <ExtSystemFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </ExtSystemFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.EXT_SYSTEM.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.EXT_SYSTEM.EDIT"></AEditButton>
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
