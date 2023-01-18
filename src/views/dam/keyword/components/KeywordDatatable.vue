<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/keywordApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
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

const columns = useTableColumns([
  { name: 'name' },
  { name: 'flags.reviewed' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: Author) => {
  router.push({ name: ROUTE.DAM.KEYWORD.DETAIL, params: { id: row.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

onMounted(() => {
  fetchList(pagination, filter)
})
</script>

<template>
  <KeywordFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </KeywordFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.KEYWORD.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.KEYWORD.EDIT"></AEditButton>
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
