<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ADatatableConfigButton,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/publicExportApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import PublicExportFilter from '@/views/coreDam/publicExport/components/PublicExportFilter.vue'
import type { PublicExport } from '@/types/coreDam/PublicExport'
import { ACL } from '@/composables/auth/auth'
import { usePublicExportListActions } from '@/views/coreDam/publicExport/composables/publicExportActions'
import { usePublicExportListFilter } from '@/model/coreDam/filter/PublicExportFilter'
import ExportTypeChip from '@/views/coreDam/publicExport/components/ExportTypeChip.vue'
import CachedAssetLicenceChip from '@/views/coreDam/assetLicence/components/CachedAssetLicenceChip.vue'


type DatatableItem = PublicExport

const router = useRouter()
const filter = usePublicExportListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = usePublicExportListActions()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  router.push({ name: ROUTE.DAM.PUBLIC_EXPORT.DETAIL, params: { id: item.id } })
}

const getList = () => {
  fetchList(pagination, filter)
}

const { columnsVisible, columnsAll, columnsHidden, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'slug' },
    { key: 'type' },
    { key: 'assetLicence' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

onMounted(() => {
  fetchList(pagination, filter)
})

defineExpose({
  refresh: getList,
})
</script>

<template>
  <div>
    <PublicExportFilter
      @submit-filter="submitFilter(filter, pagination, getList)"
      @reset-filter="resetFilter(filter, pagination, getList)"
    />
    <div>
      <div class="d-flex align-center">
        <VSpacer />
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
        <template #item.slug="{ item }: { item: DatatableItem }">
          {{ item.slug }}
        </template>
        <template #item.type="{ item }: { item: DatatableItem }">
          <ExportTypeChip :type="item.type" />
        </template>
        <template #item.assetLicence="{ item }: { item: DatatableItem }">
          <CachedAssetLicenceChip
            :id="item.assetLicence"
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
            <Acl :permission="ACL.DAM_PUBLIC_EXPORT_READ">
              <ATableDetailButton
                :route-params="{ id: item.id }"
                :route-name="ROUTE.DAM.PUBLIC_EXPORT.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_PUBLIC_EXPORT_UPDATE">
              <ATableEditButton
                :route-params="{ id: item.id }"
                :route-name="ROUTE.DAM.PUBLIC_EXPORT.EDIT"
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
