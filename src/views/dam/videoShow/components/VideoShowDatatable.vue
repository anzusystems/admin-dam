<script lang="ts" setup>
import { onMounted } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/videoShowApi'
import {
  ADatatable,
  ADatatablePagination,
  ASystemEntityScope,
  ATableCopyIdButton,
  ATableDetailButton,
  ATableEditButton,
  useAcl,
  useDatatableColumns,
  useFilterHelpers,
  usePagination,
} from '@anzusystems/common-admin'
import { ACL, type AclValue } from '@/types/Permission'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { Author } from '@/types/dam/Author'
import { useVideoShowListActions } from '@/views/dam/videoShow/composables/videoShowActions'
import VideoShowFilter from '@/views/dam/videoShow/components/VideoShowFilter.vue'
import { useVideoShowListFilter } from '@/model/dam/filter/VideoShowFilter'

const router = useRouter()
const pagination = usePagination()
const filter = useVideoShowListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useVideoShowListActions()
const getList = () => {
  fetchList(pagination, filter)
}

const columns = useDatatableColumns([{ name: 'texts.title' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

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
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.VIDEO_SHOW.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_VIDEO_SHOW_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.VIDEO_SHOW.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
