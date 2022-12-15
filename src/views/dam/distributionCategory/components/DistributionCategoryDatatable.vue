<script lang="ts" setup>
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import type { ColumnConfig } from '@/composables/system/tableColumns'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionCategoryApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { ACL } from '@/types/Permission'
import { useDistributionCategoryFilter } from '@/model/dam/filter/DistributionCategoryFilter'
import { useDistributionCategoryListActions } from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryFilter from '@/views/dam/distributionCategory/components/DistributionCategoryFilter.vue'
import { computed, onMounted } from 'vue'
import DistributionCategorySelectedOptionChip from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectedOptionChip.vue'

const router = useRouter()
const pagination = usePagination()
const filter = useDistributionCategoryFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useDistributionCategoryListActions()

const getList = () => {
  fetchList(pagination, filter)
}
const props = withDefaults(
  defineProps<{
    distributionServiceSlugs?: string[]
  }>(),
  {
    distributionServiceSlugs: () => [],
  }
)

const distributionServicesTableColumns = computed(() =>
  props.distributionServiceSlugs.map((serviceSlug): ColumnConfig => ({ name: serviceSlug, label: serviceSlug }))
)

const columns = useTableColumns([
  ...[{ name: 'name' }, { name: 'type' }],
  ...distributionServicesTableColumns.value,
  ...[{ name: 'createdAt' }, { name: 'modifiedAt' }],
])

const onRowClick = (row: ExtSystem) => {
  router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL, params: { id: row.id } })
}

onMounted(() => getList())

const refresh = () => {
  getList()
}

defineExpose({
  refresh,
})
</script>

<template>
  <DistributionCategoryFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </DistributionCategoryFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT"></AEditButton>
        </Acl>
      </template>
      <template
        v-for="distributionServiceSlug in distributionServiceSlugs"
        :key="distributionServiceSlug"
        #[distributionServiceSlug]="{ rowData }"
      >
        <DistributionCategorySelectedOptionChip
          :distribution-category="rowData"
          :service-slug="distributionServiceSlug"
        ></DistributionCategorySelectedOptionChip>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
