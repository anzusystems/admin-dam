<script lang="ts" setup>
import { useUserListActions } from '@/views/coreDam/user/composables/userActions'
import { onMounted } from 'vue'
import {
  ADatatableConfigButton,
  ADatatableOrdering,
  ADatatablePagination,
  ADatetime,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  createDatatableColumnsConfig,
  DatatableOrderingOption,
  useAcl,
  useFilterHelpers,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/userApi'
import { ROUTE } from '@/router/routes'
import type { User } from '@/types/coreDam/User'
import { useRouter } from 'vue-router'
import UserFilter from '@/views/coreDam/user/components/UserFilter.vue'
import { ACL, type AclValue } from '@/types/Permission'
import { useUserListFilter } from '@/model/coreDam/filter/UserFilter'

const router = useRouter()
const filter = useUserListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems, datatableHiddenColumns } = useUserListActions()

const getList = () => {
  fetchList(pagination, filter)
}

const { can } = useAcl<AclValue>()

const onRowClick = (event: unknown, { item }: { item: { raw: User } }) => {
  if (item.raw.id && can(ACL.DAM_USER_VIEW)) {
    router.push({ name: ROUTE.DAM.USER.DETAIL, params: { id: item.raw.id } })
  }
}

const { columnsVisible, columnsAll, columnsHidden, updateSortBy, pagination } = createDatatableColumnsConfig(
  [{ key: 'email' }, { key: 'createdAt' }, { key: 'modifiedAt' }],
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
    <UserFilter
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
        <template #item.createdAt="{ item }">
          <ADatetime :date-time="item.raw.createdAt" />
        </template>
        <template #item.modifiedAt="{ item }">
          <ADatetime :date-time="item.raw.modifiedAt" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <ATableCopyIdButton :id="item.raw.id" />
            <Acl :permission="ACL.DAM_USER_VIEW">
              <ATableDetailButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.USER.DETAIL"
              />
            </Acl>
            <Acl :permission="ACL.DAM_USER_UPDATE">
              <ATableEditButton
                :record-id="item.raw.id"
                :route-name="ROUTE.DAM.USER.EDIT"
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
