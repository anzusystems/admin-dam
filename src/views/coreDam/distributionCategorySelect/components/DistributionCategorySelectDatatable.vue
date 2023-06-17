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
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import { onMounted } from 'vue'
import { useDistributionCategorySelectListActions } from '@/views/coreDam/distributionCategorySelect/composables/distributionCategorySelectActions'
import { useDistributionCategorySelectListFilter } from '@/model/coreDam/filter/DistributionCategorySelectFilter'
import DistributionCategorySelectFilter from '@/views/coreDam/distributionCategorySelect/components/DistributionCategorySelectFilter.vue'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'

type DatatableItem = { raw: DistributionCategorySelect }

const router = useRouter()
const filter = useDistributionCategorySelectListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useDistributionCategorySelectListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.raw.id && can(ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW)) {
    router.push({ name: ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL, params: { id: item.raw.id } })
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
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.DISTRIBUTION_CATEGORY_SELECT.EDIT"
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
