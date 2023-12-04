<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ABooleanValue,
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
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
import type { DamKeyword } from '@/types/coreDam/DamKeyword'

type DatatableItem = DamKeyword

const router = useRouter()
const filter = useKeywordListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useKeywordListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_KEYWORD_VIEW)) {
    router.push({ name: ROUTE.DAM.KEYWORD.DETAIL, params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'name' }, { key: 'flags.reviewed' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
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
        <template #item.flags.reviewed="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.flags.reviewed"
          />
        </template>
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <Acl :permission="ACL.DAM_KEYWORD_VIEW">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.KEYWORD.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
              <ATableEditButton
                :record-id="item.id"
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
