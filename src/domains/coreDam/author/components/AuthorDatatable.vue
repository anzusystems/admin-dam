<script lang="ts" setup>
import type { DamAuthor } from '@anzusystems/common-admin'
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

import { ENTITY } from '@/domains/coreDam/author/api/authorApi'
import AuthorFilter from '@/domains/coreDam/author/components/AuthorFilter.vue'
import AuthorTypeChip from '@/domains/coreDam/author/components/AuthorTypeChip.vue'
import { useAuthorListActions } from '@/domains/coreDam/author/composables/authorActions'
import { getAuthorSection } from '@/domains/coreDam/author/composables/authorSection'
import { useAuthorListFilter } from '@/domains/coreDam/author/filter/AuthorFilter'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

type DatatableItem = DamAuthor

const props = withDefaults(
  defineProps<{
    source?: boolean
  }>(),
  {
    source: false,
  }
)

const router = useRouter()

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { filterData, filterConfig } = useAuthorListFilter(props.source)

const { fetchList, listItems, datatableHiddenColumns } = useAuthorListActions()

const { pagination } = usePagination('createdAt')

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  router.push({ name: getAuthorSection(item.flags.source).routeDetail, params: { id: item.id } })
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'name' },
    { key: 'identifier' },
    { key: 'type' },
    { key: 'flags.reviewed' },
    { key: 'flags.hiddenInCredit' },
    ...(props.source ? [] : [{ key: 'flags.source' }]),
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
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
    <AuthorFilter
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
        <template #item.type="{ item }: { item: DatatableItem }">
          <AuthorTypeChip :type="item.type" />
        </template>
        <template #item.flags.reviewed="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.flags.reviewed"
          />
        </template>
        <template #item.flags.hiddenInCredit="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.flags.hiddenInCredit"
          />
        </template>
        <template #item.flags.source="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.flags.source"
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
            <ATableDetailButton
              :record-id="item.id"
              :route-name="getAuthorSection(item.flags.source).routeDetail"
            />
            <Acl :permission="getAuthorSection(item.flags.source).aclUpdate">
              <ATableEditButton
                :record-id="item.id"
                :route-name="getAuthorSection(item.flags.source).routeEdit"
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
