<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@/composables/system/pagination'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import { useTableColumns } from '@/composables/system/tableColumns'
import ADatatable from '@/components/common/ADatatable.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/assetLicenceApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import { useAssetLicenceListActions } from '@/views/dam/assetLicence/composables/assetLicenceActions'
import type { AssetLicence } from '@/types/dam/AssetLicence'
import AssetLicenceFilter from '@/views/dam/assetLicence/components/AssetLicenceFilter.vue'
import { useAssetLicenceFilter } from '@/model/dam/filter/AssetLicenceFilter'
import LazyExtSystemChip from '@/views/dam/extSystem/components/LazyExtSystemChip.vue'
import { ACL } from '@/types/Permission'

const router = useRouter()
const pagination = usePagination()
const filter = useAssetLicenceFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useAssetLicenceListActions()

const columns = useTableColumns([
  { name: 'id' },
  { name: 'name' },
  { name: 'extSystem' },
  { name: 'extId' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: AssetLicence) => {
  router.push({ name: ROUTE.DAM.ASSET_LICENCE.DETAIL, params: { id: row.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

onMounted(() => {
  fetchList(pagination, filter)
})
</script>

<template>
  <AssetLicenceFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </AssetLicenceFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #extSystem="{ data }">
        <LazyExtSystemChip :id="data"></LazyExtSystemChip>
      </template>
      <template #actions="{ data }">
        <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.ASSET_LICENCE.DETAIL"></ADetailButton>
        <ACopyIdButton :id="data.id"></ACopyIdButton>
        <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.ASSET_LICENCE.EDIT"></AEditButton>
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList"></ADatatablePagination>
  </ASystemEntityScope>
</template>
