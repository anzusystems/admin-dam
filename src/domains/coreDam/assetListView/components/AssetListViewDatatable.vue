<script lang="ts" setup>
import {
  ADatatableConfigButton,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
} from '@anzusystems/common-admin'
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
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/assetListView/api/assetListViewApi'
import { useAssetListViewListActions } from '@/domains/coreDam/assetListView/composables/assetListViewActions'
import AssetListViewFilter from '@/domains/coreDam/assetListView/components/AssetListViewFilter.vue'
import { useAssetListViewListFilter } from '@/domains/coreDam/assetListView/filter/AssetListViewFilter'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import CachedAssetLicenceChip from '@/domains/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = AssetListView

const router = useRouter()

const { filterData, filterConfig } = useAssetListViewListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useAssetListViewListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig, {
  populateUrlParams: false,
  storeFiltersLocalStorage: false,
})

const { pagination } = usePagination('createdAt')
provide(DatatablePaginationKey, pagination)

const { can } = useAuth()

const { t } = useI18n()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_ASSET_LIST_VIEW_READ))
    router.push({ name: '/(coreDam)/asset-list-views/[id]', params: { id: item.id } })
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'name' },
    { key: 'extSystem' },
    { key: 'position' },
    { key: 'licences' },
    { key: 'types' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
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
    <AssetListViewFilter
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
          <CachedExtSystemChip
            :id="item.extSystem"
            variant="text"
          />
        </template>
        <template #item.licences="{ item }: { item: DatatableItem }">
          <CachedAssetLicenceChip
            v-for="assetLicenceId in item.licences"
            :id="assetLicenceId"
            :key="assetLicenceId"
            class="mr-1"
          />
        </template>
        <template #item.types="{ item }: { item: DatatableItem }">
          <VChip
            v-for="type in item.types"
            :key="type"
            class="mr-1"
            size="small"
          >
            {{ t('coreDam.asset.assetType.' + type) }}
          </VChip>
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
            <Acl :permission="ACL.DAM_ASSET_LIST_VIEW_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/asset-list-views/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_ASSET_LIST_VIEW_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/asset-list-views/[id]/edit'"
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
