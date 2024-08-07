<script lang="ts" setup>
import { onMounted } from 'vue'
import type { DamAssetLicence } from '@anzusystems/common-admin'
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
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { useAssetLicenceListActions } from '@/views/coreDam/assetLicence/composables/assetLicenceActions'
import AssetLicenceFilter from '@/views/coreDam/assetLicence/components/AssetLicenceFilter.vue'
import { useAssetLicenceListFilter } from '@/model/coreDam/filter/AssetLicenceFilter'
import CachedExtSystemChip from '@/views/coreDam/extSystem/components/CachedExtSystemChip.vue'
import { ACL, useAuth } from '@/composables/auth/auth'

type DatatableItem = DamAssetLicence

const router = useRouter()
const filter = useAssetLicenceListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useAssetLicenceListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_ASSET_LICENCE_READ))
    router.push({ name: ROUTE.DAM.ASSET_LICENCE.DETAIL, params: { id: item.id } })
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'id' }, { key: 'name' }, { key: 'extSystem' }, { key: 'extId' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
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
    <AssetLicenceFilter
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
                :route-name="ROUTE.DAM.ASSET_LICENCE.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="ROUTE.DAM.ASSET_LICENCE.EDIT"
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
