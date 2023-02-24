<script lang="ts" setup>
import { onMounted } from 'vue'
import { usePagination } from '@anzusystems/common-admin'
import { ADatatablePagination } from '@anzusystems/common-admin'
import { useDatatableColumns } from '@anzusystems/common-admin'
import { ADatatable } from '@anzusystems/common-admin'
import { ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/assetLicenceApi'
import { ATableDetailButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { ATableCopyIdButton } from '@anzusystems/common-admin'
import { ATableEditButton } from '@anzusystems/common-admin'
import { useRouter } from 'vue-router'
import { useFilterHelpers } from '@anzusystems/common-admin'
import { useAssetLicenceListActions } from '@/views/dam/assetLicence/composables/assetLicenceActions'
import type { AssetLicence } from '@/types/dam/AssetLicence'
import AssetLicenceFilter from '@/views/dam/assetLicence/components/AssetLicenceFilter.vue'
import { useAssetLicenceListFilter } from '@/model/dam/filter/AssetLicenceFilter'
import LazyExtSystemChip from '@/views/dam/extSystem/components/LazyExtSystemChip.vue'
import { ACL } from '@/types/Permission'

const router = useRouter()
const pagination = usePagination()
const filter = useAssetLicenceListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useAssetLicenceListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useDatatableColumns([
  { name: 'name' },
  { name: 'extSystem' },
  { name: 'extId' },
  { name: 'createdAt' },
  { name: 'modifiedAt' },
])

const onRowClick = (row: AssetLicence) => {
  router.push({ name: ROUTE.DAM.ASSET_LICENCE.DETAIL, params: { id: row.id } })
}

onMounted(() => {
  getList()
})

const refresh = () => {
  getList()
}

defineExpose({
  refresh,
})
</script>

<template>
  <AssetLicenceFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  />
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #extSystem="{ data }">
        <LazyExtSystemChip :id="data" variant="text" />
      </template>
      <template #actions="{ data }">
        <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.ASSET_LICENCE.DETAIL" />
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_ASSET_LICENCE_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.ASSET_LICENCE.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
