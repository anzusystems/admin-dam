<script lang="ts" setup>
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
import { ENTITY } from '@/services/api/coreDam/keywordApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import type { Author } from '@/types/coreDam/Author'
import { useKeywordListActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordListFilter } from '@/model/coreDam/filter/KeywordFilter'
import KeywordFilter from '@/views/coreDam/keyword/components/KeywordFilter.vue'

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

const { can } = useAcl<AclValue>()

const onRowClick = (row: Author) => {
  if (row.id && can(ACL.DAM_KEYWORD_VIEW)) {
    router.push({ name: ROUTE.DAM.KEYWORD.DETAIL, params: { id: row.id } })
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
  <KeywordFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  />
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <Acl :permission="ACL.DAM_KEYWORD_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.KEYWORD.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.KEYWORD.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
