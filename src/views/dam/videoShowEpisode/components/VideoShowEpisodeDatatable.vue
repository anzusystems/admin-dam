<script lang="ts" setup>
import { onMounted } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
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
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/videoShowEpisodeApi'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import type { Author } from '@/types/dam/Author'
import { useVideoShowEpisodeListActions } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeActions'
import { useVideoShowEpisodeListFilter } from '@/model/dam/filter/VideoShowEpisodeFilter'
import VideoShowEpisodeFilter from '@/views/dam/videoShowEpisode/components/VideoShowEpisodeFilter.vue'
import { ACL, type AclValue } from '@/types/Permission'

const props = withDefaults(
  defineProps<{
    videoShowId: DocId
  }>(),
  {}
)

const router = useRouter()
const pagination = usePagination()
pagination.sortBy = 'position'
const filter = useVideoShowEpisodeListFilter()
const { resetFilter, submitFilter } = useFilterHelpers()

const { fetchList, listItems } = useVideoShowEpisodeListActions()

const columns = useDatatableColumns([{ name: 'texts.title' }, { name: 'createdAt' }, { name: 'modifiedAt' }])

const { can } = useAcl<AclValue>()

const onRowClick = (row: Author) => {
  if (row.id && can(ACL.DAM_VIDEO_SHOW_EPISODE_VIEW)) {
    router.push({ name: ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL, params: { id: row.id } })
  }
}

const getList = () => {
  fetchList(props.videoShowId, pagination, filter)
}

onMounted(() => {
  fetchList(props.videoShowId, pagination, filter)
})
</script>

<template>
  <VideoShowEpisodeFilter
    @submit-filter="submitFilter(filter, pagination, getList)"
    @reset-filter="resetFilter(filter, pagination, getList)"
  />
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <ADatatable :data="listItems" :columns="columns" @row-click="onRowClick">
      <template #actions="{ data }">
        <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_VIEW">
          <ATableDetailButton :record-id="data.id" :route-name="ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL" />
        </Acl>
        <ATableCopyIdButton :id="data.id" />
        <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_UPDATE">
          <ATableEditButton :record-id="data.id" :route-name="ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT" />
        </Acl>
      </template>
    </ADatatable>
    <ADatatablePagination v-model="pagination" @change="getList" />
  </ASystemEntityScope>
</template>
