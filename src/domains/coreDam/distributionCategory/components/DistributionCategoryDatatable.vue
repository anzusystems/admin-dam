<script lang="ts" setup>
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { useDistributionCategoryListFilter } from '@/domains/coreDam/distributionCategory/filter/DistributionCategoryFilter'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategory/api/distributionCategoryApi'
import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'
import DistributionCategoryFilter from '@/domains/coreDam/distributionCategory/components/DistributionCategoryFilter.vue'
import { useDistributionCategoryListActions } from '@/domains/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategorySelectedOptionChip from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectedOptionChip.vue'
import { ADatatableConfigButton, ADatetime, ATableCopyIdButton, ATableDetailButton, ATableEditButton } from '@anzusystems/common-admin'
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

type DatatableItem = DistributionCategory

const props = withDefaults(
  defineProps<{
    distributionServiceSlugs?: string[]
  }>(),
  {
    distributionServiceSlugs: () => [],
  }
)

const router = useRouter()

const { filterData, filterConfig } = useDistributionCategoryListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useDistributionCategoryListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig)

const { pagination } = usePagination(SORT_BY_ID)
provide(DatatablePaginationKey, pagination)

const getList = useDebounceFn(() => {
  fetchList(pagination, filterData, filterConfig)
})

const distributionServicesTableColumns = computed(() =>
  props.distributionServiceSlugs.map((serviceSlug) => ({ key: serviceSlug, title: serviceSlug }))
)

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_READ)) {
    router.push({ name: '/(coreDam)/distribution-categories/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    ...[{ key: 'id' }, { key: 'name' }, { key: 'type' }],

    ...distributionServicesTableColumns.value,
    ...[{ key: 'createdAt' }, { key: 'modifiedAt' }],
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const sortByChange = () => {
  filterConfig.touched = false
  submitFilter(pagination, getList)
}

const submitFilterAction = () => {
  submitFilter(pagination, getList)
}

const resetFilterAction = () => {
  resetFilter(pagination, getList)
}

onMounted(() => {
  loadStoredFilters(pagination, getList)
})

defineExpose({
  refresh: getList,
})

const dynamicDistributionServiceSlugSlot = (distributionServiceSlug: string) => {
  return 'item.' + distributionServiceSlug
}
</script>

<template>
  <div>
    <DistributionCategoryFilter
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
        <template
          v-for="distributionServiceSlug in distributionServiceSlugs"
          :key="distributionServiceSlug"
          #[dynamicDistributionServiceSlugSlot(distributionServiceSlug)]="{ item }: { item: DatatableItem }"
        >
          <DistributionCategorySelectedOptionChip
            :distribution-category="item"
            :service-slug="distributionServiceSlug"
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
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/distribution-categories/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/distribution-categories/[id]/edit'"
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
