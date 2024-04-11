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
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/assetLicenceGroupApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useAssetLicenceGroupListActions } from '@/views/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupFilter from '@/views/coreDam/assetLicenceGroup/components/AssetLicenceGroupFilter.vue'
import { useAssetLicenceGroupListFilter } from '@/model/coreDam/filter/AssetLicenceGroupFilter'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import { ACL, type AclValue } from '@/types/Permission'
import type { AssetLicenceGroup } from '@/types/coreDam/AssetLicenceGroup'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'

type DatatableItem = AssetLicenceGroup

const router = useRouter()
const filter = useAssetLicenceGroupListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useAssetLicenceGroupListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_ASSET_LICENCE_GROUP_VIEW))
    router.push({ name: ROUTE.DAM.ASSET_LICENCE_GROUP.DETAIL, params: { id: item.id } })
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'name' },
    { key: 'extSystem' },
    { key: 'licences' },
    { key: 'createdAt' },
    { key: 'modifiedAt' }
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
</script>

<template>
  <div>
    <AssetLicenceGroupFilter
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
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.id" />
            <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_VIEW">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.ASSET_LICENCE_GROUP.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_ASSET_LICENCE_GROUP_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.ASSET_LICENCE_GROUP.EDIT"
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
