<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  DatatableOrderingOption,
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
import { useAuthorType } from '@/model/coreDam/valueObject/AuthorType'
import { useAuthorListFilter } from '@/model/coreDam/filter/AuthorFilter'

const router = useRouter()
const filter = useAuthorListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { getAuthorTypeOption } = useAuthorType()

const { fetchList, listItems, datatableHiddenColumns } = useAuthorListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const onRowClick = (event: unknown, { item }: { item: { raw: Author } }) => {
  router.push({ name: ROUTE.DAM.AUTHOR.DETAIL, params: { id: item.raw.id } })
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
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
        <template #type="{ item }">
          <VChip size="small">
            {{ getAuthorTypeOption(item.raw.type)?.title }}
          </VChip>
        </template>
        <template #item.createdAt="{ item }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <ATableDetailButton
              :record-id="item.raw.id"
              :route-name="ROUTE.DAM.AUTHOR.DETAIL"
            />
            <Acl :permission="ACL.DAM_AUTHOR_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
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
