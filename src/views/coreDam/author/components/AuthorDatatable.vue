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
import { ENTITY } from '@/services/api/coreDam/authorApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL } from '@/types/Permission'
import { useAuthorListActions } from '@/views/coreDam/author/composables/authorActions'
import type { Author } from '@/types/coreDam/Author'
import AuthorFilter from '@/views/coreDam/author/components/AuthorFilter.vue'
import { useAuthorType } from '@/model/coreDam/valueObject/AuthorType'
import { useAuthorListFilter } from '@/model/coreDam/filter/AuthorFilter'

const router = useRouter()
const pagination = usePagination()
const filter = useAuthorListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { getAuthorTypeOption } = useAuthorType()

const { fetchList, listItems } = useAuthorListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useDatatableColumns([
  { name: 'name' },
  { name: 'identifier' },
  { name: 'type' },
  { name: 'flags.reviewed' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: Author) => {
  router.push({ name: ROUTE.DAM.AUTHOR.DETAIL, params: { id: row.id } })
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
  <AuthorFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </AuthorFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #type="{ data }">
        <VChip size="small">{{ getAuthorTypeOption(data)?.title }}</VChip>
      </template>
      <template #actions="{ data }">
        <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.AUTHOR.DETAIL" />
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.AUTHOR.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>