<script lang="ts" setup>
// @ts-nocheck
// todo remove nocheck
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
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategoryApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useDistributionCategoryListFilter } from '@/model/coreDam/filter/DistributionCategoryFilter'
import { useDistributionCategoryListActions } from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryFilter from '@/views/coreDam/distributionCategory/components/DistributionCategoryFilter.vue'
import { computed, onMounted } from 'vue'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'
import DistributionCategorySelectedOptionChip from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectedOptionChip.vue'
import { ACL, useAuth } from '@/composables/auth/auth'

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
const filter = useDistributionCategoryListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useDistributionCategoryListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const distributionServicesTableColumns = computed(() =>
  props.distributionServiceSlugs.map((serviceSlug) => ({ key: serviceSlug, title: serviceSlug }))
)

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_READ)) {
    router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL, params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    ...[{ key: 'id' }, { key: 'name' }, { key: 'type' }],
    // eslint-disable-next-line vue/no-ref-object-reactivity-loss
    ...distributionServicesTableColumns.value,
    ...[{ key: 'createdAt' }, { key: 'modifiedAt' }],
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

// eslint-disable-next-line
const dynamicDistributionServiceSlugSlot = (distributionServiceSlug: string) => {
  return 'item.' + distributionServiceSlug
}
</script>

<template>
  <div>
    <DistributionCategoryFilter
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
      <!-- @vue-ignore -->
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
            :distribution-category="item.raw as any"
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
                :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT"
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
