<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ABooleanValue,
  AChipNoLink,
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  type AnzuUser,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  type DatatableOrderingOption,
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/common/anzuUserApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import { useAnzuUserFilter } from '@/model/common/filter/AnzuUserFilter'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserFilter from '@/views/common/anzuUser/components/AnzuUserFilter.vue'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'
import CachedPermissionGroupChip from '@/views/common/permissionGroup/components/CachedPermissionGroupChip.vue'
import { damClient } from '@/services/api/clients/damClient'

type DatatableItem = AnzuUser

const router = useRouter()

const filter = useAnzuUserFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchAnzuUserList, anzuUserList, datatableHiddenColumns } = useAnzuUserActions(damClient)
const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_USER_VIEW)) {
    router.push({ name: ROUTE.COMMON.ANZU_USER.DETAIL, params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'email' },
    { key: 'enabled' },
    { key: 'roles' },
    { key: 'permissionGroups' },
    { key: 'permissions' },
    { key: 'createdAt' },
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  'common',
  ENTITY
)

const getList = () => {
  fetchAnzuUserList(pagination, filter)
}

const { translatePermission } = usePermissionConfigActions(damClient)

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
    <AnzuUserFilter
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
        :items="anzuUserList"
        :items-length="anzuUserList.length"
        item-value="id"
        @click:row="onRowClick"
      >
        <template #item.enabled="{ item }: { item: DatatableItem }">
          <ABooleanValue
            chip
            :value="item.enabled"
          />
        </template>
        <template #item.roles="{ item }: { item: DatatableItem }">
          <AChipNoLink
            v-for="role in item.roles"
            :key="role"
            class="mr-1 mb-1"
          >
            {{ translatePermission('roles', role) }}
          </AChipNoLink>
          <span v-if="item.roles.length === 0">-</span>
        </template>
        <template #item.permissionGroups="{ item }: { item: DatatableItem }">
          <CachedPermissionGroupChip
            v-for="permissionGroupId in item.permissionGroups"
            :id="permissionGroupId"
            :key="permissionGroupId"
            class="mr-1 mb-1"
          />
          <span v-if="item.permissionGroups.length === 0">-</span>
        </template>
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
            <ATableCopyIdButton
              v-if="item.id"
              :id="item.id"
            />
            <Acl :permission="ACL.DAM_USER_VIEW">
              <ATableDetailButton
                v-if="item.id"
                :record-id="item.id"
                :route-name="ROUTE.COMMON.ANZU_USER.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_USER_UPDATE">
              <ATableEditButton
                v-if="item.id"
                :record-id="item.id"
                :route-name="ROUTE.COMMON.ANZU_USER.EDIT"
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
