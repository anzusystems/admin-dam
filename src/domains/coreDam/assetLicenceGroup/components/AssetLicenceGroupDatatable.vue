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
import type { DamAssetLicenceGroup } from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'

import CachedAssetLicenceChip from '@/domains/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import { ENTITY } from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import AssetLicenceGroupFilter from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupFilter.vue'
import { useAssetLicenceGroupListActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import { useAssetLicenceGroupListFilter } from '@/domains/coreDam/assetLicenceGroup/filter/AssetLicenceGroupFilter'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

type DatatableItem = DamAssetLicenceGroup

const router = useRouter()

const { filterData, filterConfig } = useAssetLicenceGroupListFilter()

const { fetchList, listItems, datatableHiddenColumns } = useAssetLicenceGroupListActions()

const { pagination } = usePagination('createdAt')

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_ASSET_LICENCE_GROUP_READ))
    router.push({ name: '/(coreDam)/asset-licence-groups/[id]', params: { id: item.id } })
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'name' },
    { key: 'extSystem' },
    { key: 'licences' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const { getList, sortByChange, submitFilterAction, resetFilterAction } = useDatatableList(
  filterData,
  filterConfig,
  pagination,
  fetchList,
  { populateUrlParams: false, storeFiltersLocalStorage: false }
)

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <AssetLicenceGroupFilter
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
        <template #item.extSystem="{ item }: { item: DatatableItem }">
          <CachedExtSystemChip :id="item.extSystem" />
        </template>
        <template #item.licences="{ item }: { item: DatatableItem }">
          <CachedAssetLicenceChip
            v-for="assetLicenceId in item.licences"
            :id="assetLicenceId"
            :key="assetLicenceId"
            class="mr-1"
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
            <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(coreDam)/asset-licence-groups/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(coreDam)/asset-licence-groups/[id]/edit'"
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
