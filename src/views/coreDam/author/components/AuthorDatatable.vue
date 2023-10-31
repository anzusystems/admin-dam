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
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/authorApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL } from '@/types/Permission'
import { useAuthorListActions } from '@/views/coreDam/author/composables/authorActions'
import type { Author } from '@/types/coreDam/Author'
import AuthorFilter from '@/views/coreDam/author/components/AuthorFilter.vue'
import { useAuthorListFilter } from '@/model/coreDam/filter/AuthorFilter'
import AuthorTypeChip from '@/views/coreDam/author/components/AuthorTypeChip.vue'

type DatatableItem = Author

const router = useRouter()
const filter = useAuthorListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useAuthorListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  router.push({ name: ROUTE.DAM.AUTHOR.DETAIL, params: { id: item.id } })
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
              :route-name="ROUTE.DAM.AUTHOR.DETAIL"
            />
            <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.AUTHOR.EDIT"
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
