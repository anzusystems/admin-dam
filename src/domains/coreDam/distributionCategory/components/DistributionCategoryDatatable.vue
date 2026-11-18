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
  useDatatableList,
  usePagination,
} from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { ENTITY } from '@/domains/coreDam/distributionCategory/api/distributionCategoryApi'
import DistributionCategoryFilter from '@/domains/coreDam/distributionCategory/components/DistributionCategoryFilter.vue'
import { useDistributionCategoryListActions } from '@/domains/coreDam/distributionCategory/composables/distributionCategoryActions'
import { useDistributionCategoryListFilter } from '@/domains/coreDam/distributionCategory/filter/DistributionCategoryFilter'
import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'
import DistributionCategorySelectedOptionChip from '@/domains/coreDam/distributionCategorySelect/components/DistributionCategorySelectedOptionChip.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

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

const { fetchList, listItems, datatableHiddenColumns } = useDistributionCategoryListActions()

const { pagination } = usePagination('createdAt')

const { getList, sortByChange, submitFilterAction, resetFilterAction } = useDatatableList(
  filterData,
  filterConfig,
  pagination,
  fetchList,
  { populateUrlParams: false, storeFiltersLocalStorage: false }
)

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
    { key: 'id' },
    { key: 'name' },
    { key: 'type' },

    // createDatatableColumnsConfig takes a plain ColumnConfig[], not a ref, so the columns
    // are fixed at setup by its signature.
    // eslint-disable-next-line vue/no-ref-object-reactivity-loss
    ...distributionServicesTableColumns.value,
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

defineExpose({
  refresh: getList,
})

const dynamicDistributionServiceSlugSlot = (distributionServiceSlug: string) => 'item.' + distributionServiceSlug
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
          <ADatatablePagination @change="getList" />
        </template>
      </VDataTableServer>
    </div>
  </div>
</template>
