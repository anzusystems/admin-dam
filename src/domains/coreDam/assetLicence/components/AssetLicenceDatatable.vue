<script lang="ts" setup>
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  DatatablePaginationKey,
  FilterConfigKey,
  FilterDataKey,
  createDatatableColumnsConfig,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { useDebounceFn } from '@vueuse/core'
import { onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'

import { ENTITY } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import AssetLicenceFilter from '@/domains/coreDam/assetLicence/components/AssetLicenceFilter.vue'
import { useAssetLicenceListActions } from '@/domains/coreDam/assetLicence/composables/assetLicenceActions'
import { useAssetLicenceListFilter } from '@/domains/coreDam/assetLicence/filter/AssetLicenceFilter'
import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

type DatatableItem = DamAssetLicenceExtended

const router = useRouter()

const { filterData, filterConfig } = useAssetLicenceListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useAssetLicenceListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig, {
  populateUrlParams: false,
  storeFiltersLocalStorage: false,
})

const { pagination } = usePagination('createdAt')
provide(DatatablePaginationKey, pagination)

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_ASSET_LICENCE_READ))
    router.push({ name: '/(coreDam)/asset-licences/[id]', params: { id: item.id } })
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'name' }, { key: 'extSystem' }, { key: 'extId' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const getList = useDebounceFn(() => {
  fetchList(pagination, filterData, filterConfig)
})

const sortByChange = () => {
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
</script>

<template>
  <div>
    <AssetLicenceFilter
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
        item-value="id"
        @click:row="onRowClick"
      >
        <template #item.extSystem="{ item }: { item: DatatableItem }">
          <CachedExtSystemChip :id="item.extSystem" />
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
            <Acl :permission="ACL.DAM_ASSET_LICENCE_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/asset-licences/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/asset-licences/[id]/edit'"
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
