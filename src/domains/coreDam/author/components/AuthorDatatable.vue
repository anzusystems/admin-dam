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
  type DatatableOrderingOption,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/author/api/authorApi'
import { useAuthorListActions } from '@/domains/coreDam/author/composables/authorActions'
import AuthorFilter from '@/domains/coreDam/author/components/AuthorFilter.vue'
import { useAuthorListFilter } from '@/domains/coreDam/author/filter/AuthorFilter'
import AuthorTypeChip from '@/domains/coreDam/author/components/AuthorTypeChip.vue'
import { ACL } from '@/domains/system/auth/auth'

type DatatableItem = DamAuthor

const router = useRouter()
const filter = useAuthorListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useAuthorListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  router.push({ name: '/(coreDam)/authors/[id]', params: { id: item.id } })
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'name' },
    { key: 'identifier' },
    { key: 'type' },
    { key: 'flags.reviewed' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
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
    <AuthorFilter
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
        <template #item.type="{ item }: { item: DatatableItem }">
          <AuthorTypeChip :type="item.type" />
        </template>
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
            <ATableDetailButton
              :record-id="item.id"
              :route-name="'/(coreDam)/authors/[id]'"
            />
            <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/authors/[id]/edit'"
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
