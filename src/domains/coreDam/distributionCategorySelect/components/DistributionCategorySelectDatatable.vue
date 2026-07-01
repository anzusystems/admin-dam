<script lang="ts" setup>
import {
  ADatatableConfigButton,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
} from '@anzusystems/common-admin'
import {
  ADatatableOrdering,
  ADatatablePagination,
  createDatatableColumnsConfig,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin/labs'
import { useDebounceFn } from '@vueuse/core'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { useDistributionCategorySelectListActions } from '@/domains/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategorySelectListFilter } from '@/domains/coreDam/distributionCategorySelect/filter/DistributionCategorySelectFilter'
import DistributionCategorySelectFilter from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectFilter.vue'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = DistributionCategorySelect

const router = useRouter()

const { filterData, filterConfig } = useDistributionCategorySelectListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useDistributionCategorySelectListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig)

const { pagination } = usePagination('id')
provide(DatatablePaginationKey, pagination)

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_READ)) {
    router.push({ name: '/(coreDam)/distribution-category-selects/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'serviceSlug' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const getList = useDebounceFn(() => fetchList(pagination, filterData, filterConfig))

const sortByChange = () => {
  submitFilter(pagination, getList)
}

const submitFilterAction = () => submitFilter(pagination, getList)
const resetFilterAction = () => resetFilter(pagination, getList)

onMounted(() => loadStoredFilters(pagination, getList))

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <DistributionCategorySelectFilter
      @submit="submitFilterAction"
      @reset="resetFilterAction"
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
