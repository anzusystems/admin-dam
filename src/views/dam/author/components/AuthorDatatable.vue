<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/authorApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
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
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.AUTHOR.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.AUTHOR.EDIT"></AEditButton>
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
