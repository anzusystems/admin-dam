<script lang="ts" setup>
import { onMounted } from 'vue'
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
import { ENTITY } from '@/services/api/coreDam/extSystemApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useExtSystemListFilter } from '@/model/coreDam/filter/ExtSystemFilter'
import { useExtSystemListActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import ExtSystemFilter from '@/views/coreDam/extSystem/components/ExtSystemFilter.vue'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'
import { ACL } from '@/types/Permission'

const router = useRouter()
const filter = useExtSystemListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useExtSystemListActions()

const onRowClick = (event: unknown, { item }: { item: { raw: ExtSystem } }) => {
  if (item.raw.id) {
    router.push({ name: ROUTE.DAM.EXT_SYSTEM.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'name' }, { key: 'slug' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
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
        <template #item.createdAt="{ item }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_EXT_SYSTEM_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.EXT_SYSTEM.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.EXT_SYSTEM.EDIT"
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
