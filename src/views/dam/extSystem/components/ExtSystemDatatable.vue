<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@anzusystems/common-admin'
import { ADatatablePagination } from '@anzusystems/common-admin'
import { useDatatableColumns } from '@anzusystems/common-admin'
import { ADatatable } from '@anzusystems/common-admin'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/extSystemApi'
import { ATableDetailButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ATableCopyIdButton } from '@anzusystems/common-admin'
import { ATableEditButton } from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { useExtSystemListFilter } from '@/model/dam/filter/ExtSystemFilter'
import { useExtSystemListActions } from '@/views/dam/extSystem/composables/extSystemActions'
import ExtSystemFilter from '@/views/dam/extSystem/components/ExtSystemFilter.vue'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { ACL } from '@/types/Permission'

const router = useRouter()
const pagination = usePagination()
const filter = useExtSystemListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useExtSystemListActions()

const columns = useDatatableColumns([{ name: 'name' }, { name: 'slug' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

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
        <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.EXT_SYSTEM.DETAIL" />
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.EXT_SYSTEM.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
