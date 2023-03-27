<script lang="ts" setup>
import { onMounted } from 'vue'
import {
  ABooleanValue,
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  type AnzuUser,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  DatatableOrderingOption,
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/common/anzuUserApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL, type AclValue } from '@/types/Permission'
import type { AxiosInstance } from 'axios'
import { useAnzuUserFilter } from '@/model/common/filter/AnzuUserFilter'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserFilter from '@/views/common/anzuUser/components/AnzuUserFilter.vue'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'
import CachedPermissionGroupChip from '@/views/common/permissionGroup/components/CachedPermissionGroupChip.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'

const props = defineProps<{
  client: () => AxiosInstance
}>()

const router = useRouter()

const filter = useAnzuUserFilter()
const { resetFilter, submitFilter } = useFilterHelpers()
const { fetchAnzuUserList, anzuUserList, loadingAnzuUserList, datatableHiddenColumns } = useAnzuUserActions(props.client)
const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: { raw: AnzuUser } }) => {
  if (item.raw.id && can(ACL.DAM_USER_VIEW)) {
    router.push({ name: ROUTE.COMMON.ANZU_USER.DETAIL, params: { id: item.raw.id } })
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
    { key: 'modifiedAt' },
  ],
  datatableHiddenColumns,
  SYSTEM_CORE_DAM,
  ENTITY
)

const getList = () => {
  fetchAnzuUserList(pagination, filter)
}

const { translatePermission } = usePermissionConfigActions(props.client)

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
        :items="listItems"
        :items-length="listItems.length"
        item-value="id"
        @click:row="onRowClick"
      >
        <template #enabled="{ item }">
          <ABooleanValue
            chip
            :value="item.raw.enabled"
          />
        </template>
        <template #roles="{ item }">
          <VChip
            v-for="role in item.raw.roles"
            :key="role"
            class="mr-1 mb-1"
          >
            {{ translatePermission('roles', role) }}
          </VChip>
          <span v-if="item.raw.roles.length === 0">-</span>
        </template>
        <template #permissionGroups="{ item }">
          <CachedPermissionGroupChip
            v-for="permissionGroupId in item.raw.permissionGroups"
            :id="permissionGroupId"
            :key="permissionGroupId"
            class="mr-1 mb-1"
          />
          <span v-if="item.raw.permissionGroups.length === 0">-</span>
        </template>
        <template #permissions="{ item }">
          <VChip>{{ Object.keys(item.raw.permissions).length }}</VChip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_USER_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.COMMON.ANZU_USER.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_USER_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
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
