<script lang="ts" setup>
import type { DamKeyword } from '@anzusystems/common-admin'
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
  useDatatableList,
  usePagination,
} from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'

import { ENTITY } from '@/domains/coreDam/keyword/api/keywordApi'
import KeywordFilter from '@/domains/coreDam/keyword/components/KeywordFilter.vue'
import { useKeywordListActions } from '@/domains/coreDam/keyword/composables/keywordActions'
import { useKeywordListFilter } from '@/domains/coreDam/keyword/filter/KeywordFilter'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

type DatatableItem = DamKeyword

const router = useRouter()

const { filterData, filterConfig } = useKeywordListFilter()

const { fetchList, listItems, datatableHiddenColumns } = useKeywordListActions()

const { pagination } = usePagination('createdAt')

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_KEYWORD_READ)) {
    router.push({ name: '/(coreDam)/keywords/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'name' }, { key: 'flags.reviewed' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const { getList, sortByChange, submitFilterAction, resetFilterAction } = useDatatableList(
  filterData,
  filterConfig,
  pagination,
  fetchList,
  { populateUrlParams: false, storeFiltersLocalStorage: false }
)

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <KeywordFilter
      @submit="submitFilterAction"
      @reset="resetFilterAction"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
        <ADatatableOrdering
          variant="createdAt"
          @sort-by-change="sortByChange"
        />
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
            <Acl :permission="ACL.DAM_KEYWORD_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/keywords/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_KEYWORD_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/keywords/[id]/edit'"
              />
            </Acl>
          </div>
        </template>
        <template #bottom>
          <ADatatablePagination @change="getList" />
        </template>
      </VDataTableServer>
    </div>
  </div>
</template>
