<script lang="ts" setup>
import {
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
import { ENTITY } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { useDistributionCategorySelectListActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategorySelectListFilter } from '@/domains/coreDam/distributionCategorySelect/filter/DistributionCategorySelectFilter'
import DistributionCategorySelectFilter from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectFilter.vue'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = DistributionCategorySelect

const router = useRouter()
const filter = useDistributionCategorySelectListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useDistributionCategorySelectListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ)) {
    router.push({ name: '/(coreDam)/distribution-category-selects/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'serviceSlug' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

onMounted(() => getList())

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <DistributionCategorySelectFilter
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
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/distribution-category-selects/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/distribution-category-selects/[id]/edit'"
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
