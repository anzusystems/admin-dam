<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination, ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  useAcl,
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
import { ACL, type AclValue } from '@/types/Permission'
import type { AssetLicence } from '@/types/coreDam/AssetLicence'

const router = useRouter()
const filter = useAssetLicenceListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useAssetLicenceListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: { raw: AssetLicence } }) => {
  if (item.raw.id && can(ACL.DAM_ASSET_LICENCE_VIEW))
    router.push({ name: ROUTE.DAM.ASSET_LICENCE.DETAIL, params: { id: item.raw.id } })
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'name' },
    { key: 'extSystem' },
    { key: 'extId' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
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
        <template #extSystem="{ item }">
          <CachedExtSystemChip
            :id="item.raw.extSystem"
            variant="text"
          />
        </template>
        <template #item.createdAt="{ item }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_ASSET_LICENCE_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.ASSET_LICENCE.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
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
