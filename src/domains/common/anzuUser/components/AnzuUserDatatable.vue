<script lang="ts" setup>
import {
  ABooleanValue,
  AChipNoLink,
  ADatatableConfigButton,
  ADatetime,
  type AnzuUser,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
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
import { ENTITY } from '@/domains/common/anzuUser/api/anzuUserApi'
import { useAnzuUserFilter } from '@/domains/common/anzuUser/filter/AnzuUserFilter'
import { useAnzuUserActions } from '@/domains/common/anzuUser/composables/anzuUserActions'
import AnzuUserFilter from '@/domains/common/anzuUser/components/AnzuUserFilter.vue'
import { usePermissionConfigActions } from '@/domains/common/permission/composables/permissionConfigActions'
import CachedPermissionGroupChip from '@/domains/common/permissionGroup/components/CachedPermissionGroupChip.vue'
import { damClient } from '@/shared/apiClients/damClient'
import { ACL, useAuth } from '@/domains/system/auth/auth'

type DatatableItem = AnzuUser

const router = useRouter()

const { filterData, filterConfig } = useAnzuUserFilter()
provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

const { fetchAnzuUserList, anzuUserList, datatableHiddenColumns } = useAnzuUserActions()
const { resetFilter, submitFilter } = useFilterHelpers(filterData, filterConfig)

const { pagination } = usePagination(SORT_BY_ID)
provide(DatatablePaginationKey, pagination)

const { can } = useAuth()

const onRowClick = (event: unknown, { item }: { item: DatatableItem }) => {
  if (item.id && can(ACL.DAM_USER_READ)) {
    router.push({ name: '/(common)/anzu-users/[id]', params: { id: item.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden } = createDatatableColumnsConfig(
  [
    { key: 'id' },
    { key: 'person.firstName' },
    { key: 'person.lastName' },
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

const getList = useDebounceFn(() => {
  fetchAnzuUserList(pagination, filterData, filterConfig)
})

const { translatePermission } = usePermissionConfigActions(damClient)

const sortByChange = () => {
  filterConfig.touched = false
  submitFilter(pagination, getList)
}

const submitFilterAction = () => {
  submitFilter(pagination, getList)
}

const resetFilterAction = () => {
  resetFilter(pagination, getList)
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
        <template #item.person.firstName="{ item }: { item: DatatableItem }">
          {{ item.person.firstName }}
        </template>
        <template #item.person.lastName="{ item }: { item: DatatableItem }">
          {{ item.person.lastName }}
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
            <Acl :permission="ACL.DAM_USER_READ">
              <ATableDetailButton
                v-if="item.id"
                :record-id="item.id"
                :route-name="'/(common)/anzu-users/[id]'"
              />
            </Acl>
            <Acl :permission="ACL.DAM_USER_UPDATE">
              <ATableEditButton
                v-if="item.id"
                :record-id="item.id"
                :route-name="'/(common)/anzu-users/[id]/edit'"
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
