<script lang="ts" setup>
import type { DamExtSystem } from '@anzusystems/common-admin'
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
import { ENTITY } from '@/domains/coreDam/extSystem/api/extSystemApi'
import { useExtSystemListFilter } from '@/domains/coreDam/extSystem/filter/ExtSystemFilter'
import { useExtSystemListActions } from '@/domains/coreDam/extSystem/composables/extSystemActions'
import ExtSystemFilter from '@/domains/coreDam/extSystem/components/ExtSystemFilter.vue'

import { ACL } from '@/domains/system/auth/auth'

type DatatableItem = DamExtSystem

const router = useRouter()
const filter = useExtSystemListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useExtSystemListActions()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id) {
    router.push({ name: '/(coreDam)/ext-systems/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'name' }, { key: 'slug' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const sortByChange = (option: DatatableOrderingOption) => {
  updateSortBy(option.sortBy)
  getList()
}

const getList = () => {
  fetchList(pagination, filter)
}

onMounted(() => {
  fetchList(pagination, filter)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <ExtSystemFilter
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
            <Acl :permission="ACL.DAM_EXT_SYSTEM_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/ext-systems/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/ext-systems/[id]/edit'"
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
