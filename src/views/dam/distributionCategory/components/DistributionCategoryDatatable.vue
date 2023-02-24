<script lang="ts" setup>
import type { DatatableColumnConfig } from '@anzusystems/common-admin'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  useDatatableColumns,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionCategoryApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { ACL, type AclValue } from '@/types/Permission'
import { useDistributionCategoryListFilter } from '@/model/dam/filter/DistributionCategoryFilter'
import { useDistributionCategoryListActions } from '@/views/dam/distributionCategory/composables/distributionCategoryActions'
import DistributionCategoryFilter from '@/views/dam/distributionCategory/components/DistributionCategoryFilter.vue'
import { computed, onMounted } from 'vue'
import DistributionCategorySelectedOptionChip from '@/views/dam/distributionCategorySelect/components/DistributionCategorySelectedOptionChip.vue'
import { useAcl } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    distributionServiceSlugs?: string[]
  }>(),
  {
    distributionServiceSlugs: () => [],
  }
)

const router = useRouter()
const pagination = usePagination()
const filter = useDistributionCategoryListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useDistributionCategoryListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const distributionServicesTableColumns = computed(() =>
  props.distributionServiceSlugs.map(
    (serviceSlug): DatatableColumnConfig => ({ name: serviceSlug, label: serviceSlug })
  )
)

const columns = useDatatableColumns([
  ...[{ name: 'name' }, { name: 'type' }],
  ...distributionServicesTableColumns.value,
  ...[{ name: 'createdAt' }, { name: 'modifiedAt' }],
])
const { can } = useAcl<AclValue>()

const onRowClick = (row: ExtSystem) => {
  if (row.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_VIEW)) {
    router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL, params: { id: row.id } })
  }
}

onMounted(() => {
  getList()
})

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
        <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY.EDIT" />
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
        />
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
