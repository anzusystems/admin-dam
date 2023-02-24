<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@anzusystems/common-admin'
import { ADatatablePagination } from '@anzusystems/common-admin'
import { useDatatableColumns } from '@anzusystems/common-admin'
import { ADatatable } from '@anzusystems/common-admin'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/keywordApi'
import { ATableDetailButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ATableCopyIdButton } from '@anzusystems/common-admin'
import { ATableEditButton } from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@anzusystems/common-admin'
import { ACL } from '@/types/Permission'
import type { Author } from '@/types/dam/Author'
import { useKeywordListActions } from '@/views/dam/keyword/composables/keywordActions'
import { useKeywordListFilter } from '@/model/dam/filter/KeywordFilter'
import KeywordFilter from '@/views/dam/keyword/components/KeywordFilter.vue'

const router = useRouter()
const pagination = usePagination()
const filter = useKeywordListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useKeywordListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useDatatableColumns([
  { name: 'name' },
  { name: 'flags.reviewed' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: Author) => {
  router.push({ name: ROUTE.DAM.KEYWORD.DETAIL, params: { id: row.id } })
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
  <KeywordFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  />
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.KEYWORD.DETAIL" />
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.KEYWORD.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
