<script lang="ts" setup>
import { onMounted } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/videoShowApi'
import ADetailButton from '@/components/common/buttons/table/ADetailButton.vue'
import { ROUTE } from '@/router/routes'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import AEditButton from '@/components/common/buttons/table/AEditButton.vue'
import { useRouter } from 'vue-router'
import type { Author } from '@/types/dam/Author'
import { useVideoShowListActions } from '@/views/dam/videoShow/composables/videoShowActions'
import VideoShowFilter from '@/views/dam/videoShow/components/VideoShowFilter.vue'
import { useVideoShowListFilter } from '@/model/dam/filter/VideoShowFilter'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope, useAcl,
  useFilterHelpers,
  usePagination,
  useTableColumns,
} from '@anzusystems/common-admin'
import { ACL, type AclValue } from '@/types/Permission'

const router = useRouter()
const pagination = usePagination()
const filter = useVideoShowListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useVideoShowListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useTableColumns([{ name: 'texts.title' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

const { can } = useAcl<AclValue>()

const onRowClick = (row: Author) => {
  if (row.id && can(ACL.DAM_VIDEO_SHOW_VIEW)) {
    router.push({ name: ROUTE.DAM.VIDEO_SHOW.DETAIL, params: { id: row.id } })
  }
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
  <VideoShowFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  >
  </VideoShowFilter>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <Acl :permission="ACL.DAM_VIDEO_SHOW_VIEW">
          <ADetailButton :record-id="data.id" :route-name="ROUTE.DAM.VIDEO_SHOW.DETAIL" />
        </Acl>
        <ACopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_VIDEO_SHOW_UPDATE">
          <AEditButton :record-id="data.id" :route-name="ROUTE.DAM.VIDEO_SHOW.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
