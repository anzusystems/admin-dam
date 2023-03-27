<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  DatatableOrderingOption,
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/keywordApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import { useKeywordListActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordListFilter } from '@/model/coreDam/filter/KeywordFilter'
import KeywordFilter from '@/views/coreDam/keyword/components/KeywordFilter.vue'
import type { Keyword } from '@/types/coreDam/Keyword'

const router = useRouter()
const filter = useKeywordListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useKeywordListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: { raw: Keyword } }) => {
  if (item.raw.id && can(ACL.DAM_KEYWORD_VIEW)) {
    router.push({ name: ROUTE.DAM.KEYWORD.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'name' }, { key: 'flags.reviewed' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

onMounted(() => {
  getList()
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <KeywordFilter
      @submit-filter="submitFilter(filter, pagination, getList)"
      @reset-filter="resetFilter(filter, pagination, getList)"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <ADatatableOrdering @sort-by-change="sortByChange" />
        <ADatatableConfigButton
          v-model:columns-hidden="columnsHidden"
          :columns-all="columnsAll"
        />
      </div>
      <VDataTableServer
        class="a-datatable"
        :headers="columnsVisible"
        :items="listItems"
        :items-length="listItems.length"
        item-value="id"
        @click:row="onRowClick"
      >
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_KEYWORD_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.KEYWORD.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.KEYWORD.EDIT"
              />
            </Acl>
          </div>
        </template>
        <template #bottom>
          <ADatatablePagination
            v-model="pagination"
            @change="getList"
          />
        </template>
      </VDataTableServer>
    </div>
  </div>
</template>
