<script lang="ts" setup>
import { onMounted } from 'vue'
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
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/extSystemApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
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
        <Acl :permission="ACL.DAM_EXT_SYSTEM_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.EXT_SYSTEM.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.EXT_SYSTEM.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
