<script lang="ts" setup>
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
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { ENTITY } from '@/domains/common/permissionGroup/api/permissionGroupApi'
import { usePermissionGroupListFilter } from '@/domains/common/permissionGroup/filter/PermissionGroupFilter'
import { usePermissionGroupActions } from '@/domains/common/permissionGroup/composables/permissionGroupActions'
import PermissionGroupFilter from '@/domains/common/permissionGroup/components/PermissionGroupFilter.vue'
import { damClient } from '@/shared/apiClients/damClient'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = PermissionGroup

const router = useRouter()

const filter = usePermissionGroupListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchPermissionGroupList, permissionGroupList, datatableHiddenColumns } = usePermissionGroupActions(damClient)
const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_PERMISSION_GROUP_READ)) {
    router.push({ name: '/(common)/permission-groups/[id]', params: { id: item.id } })
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
          {{ Object.keys(item.permissions).length }}
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
            <Acl :permission="ACL.DAM_PERMISSION_GROUP_READ">
              <ATableDetailButton
                :record-id="item.id"
                :route-name="'/(common)/permission-groups/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_PERMISSION_GROUP_UPDATE">
              <ATableEditButton
                :record-id="item.id"
                :route-name="'/(common)/permission-groups/[id]/edit'"
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
