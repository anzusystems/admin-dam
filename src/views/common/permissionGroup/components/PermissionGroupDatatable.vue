<script lang="ts" setup>
import { onMounted } from 'vue'
import type { PermissionGroup } from '@anzusystems/common-admin'
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
import { ENTITY } from '@/services/api/common/permissionGroupApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import { usePermissionGroupListFilter } from '@/model/common/filter/PermissionGroupFilter'
import { usePermissionGroupActions } from '@/views/common/permissionGroup/composables/permissionGroupActions'
import PermissionGroupFilter from '@/views/common/permissionGroup/components/PermissionGroupFilter.vue'
import { damClient } from '@/services/api/clients/damClient'

type DatatableItem = { raw: PermissionGroup }

const router = useRouter()

const filter = usePermissionGroupListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchPermissionGroupList, permissionGroupList, datatableHiddenColumns } = usePermissionGroupActions(damClient)
const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.raw.id && can(ACL.DAM_PERMISSION_GROUP_VIEW)) {
    router.push({ name: ROUTE.COMMON.PERMISSION_GROUP.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'title' },
    { key: 'description' },
    { key: 'permissions' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  'common',
  ENTITY
)

const getList = () => {
  fetchPermissionGroupList(pagination, filter)
}

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
    <PermissionGroupFilter
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
        :items="permissionGroupList"
        :items-length="permissionGroupList.length"
        item-value="id"
        @click:row="onRowClick"
      >
        <template #item.permissions="{ item }: { item: DatatableItem }">
          {{ Object.keys(item.raw.permissions).length }}
        </template>
        <template #item.createdAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }: { item: DatatableItem }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }: { item: DatatableItem }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_PERMISSION_GROUP_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.COMMON.PERMISSION_GROUP.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_PERMISSION_GROUP_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
                :route-name="ROUTE.COMMON.PERMISSION_GROUP.EDIT"
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
