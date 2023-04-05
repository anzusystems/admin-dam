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
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategoryApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import { useDistributionCategoryListFilter } from '@/model/coreDam/filter/DistributionCategoryFilter'
import {
  useDistributionCategoryListActions
} from '@/views/coreDam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryFilter from '@/views/coreDam/distributionCategory/components/DistributionCategoryFilter.vue'
import { computed, onMounted } from 'vue'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'
import DistributionCategorySelectedOptionChip
  from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectedOptionChip.vue'

type DatatableItem = { raw: DistributionCategory }

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

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.raw.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_VIEW)) {
    router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    ...[{ key: 'id' }, { key: 'name' }, { key: 'type' }],
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
            :distribution-category="item.raw"
            :service-slug="distributionServiceSlug"
          />
        </template>
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
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
