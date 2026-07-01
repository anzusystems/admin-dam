<script lang="ts" setup>
import {
  ADatatableConfigButton,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  type DamAssetLicenceGroup,
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
import { ENTITY } from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import { useAssetLicenceGroupListActions } from '@/domains/coreDam/assetLicenceGroup/composables/assetLicenceGroupActions'
import AssetLicenceGroupFilter from '@/domains/coreDam/assetLicenceGroup/components/AssetLicenceGroupFilter.vue'
import { useAssetLicenceGroupListFilter } from '@/domains/coreDam/assetLicenceGroup/filter/AssetLicenceGroupFilter'
import CachedExtSystemChip from '@/domains/coreDam/extSystem/components/CachedExtSystemChip.vue'
import CachedAssetLicenceChip from '@/domains/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = DamAssetLicenceGroup

const router = useRouter()

const { filterData, filterConfig } = useAssetLicenceGroupListFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchList, listItems, datatableHiddenColumns } = useAssetLicenceGroupListActions()
const { resetFilter, submitFilter, loadStoredFilters } = useFilterHelpers(filterData, filterConfig)

const { pagination } = usePagination('id')
provide(DatatablePaginationKey, pagination)

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
    <AssetLicenceGroupFilter
      @submit="submitFilterAction"
      @reset="resetFilterAction"
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
          <ADatatablePagination
            v-model="pagination"
            @change="getList"
          />
        </template>
      </VDataTableServer>
    </div>
  </div>
</template>
