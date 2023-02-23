<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@anzusystems/common-admin'
import { ADatatablePagination } from '@anzusystems/common-admin'
import { useTableColumns } from '@/composables/system/tableColumns'
import { ADatatable } from '@anzusystems/common-admin'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/authorApi'
import { ATableDetailButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ATableCopyIdButton } from '@anzusystems/common-admin'
import { ATableEditButton } from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { ACL } from '@/types/Permission'
import { useAuthorListActions } from '@/views/dam/author/composables/authorActions'
import type { Author } from '@/types/dam/Author'
import AuthorFilter from '@/views/dam/author/components/AuthorFilter.vue'
import { useAuthorType } from '@/model/dam/valueObject/AuthorType'
import { useAuthorListFilter } from '@/model/dam/filter/AuthorFilter'

const router = useRouter()
const pagination = usePagination()
const filter = useAuthorListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { getAuthorTypeOption } = useAuthorType()

const { fetchList, listItems } = useAuthorListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useTableColumns([
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
