<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import { usePagination, usePaginationAutoHide } from '@/composables/system/pagination'
import type { VideoShowEpisode } from '@/types/dam/VideoShowEpisode'
import { useVideoShowEpisodeListFilter } from '@/model/dam/filter/VideoShowEpisodeFilter'
import { fetchVideoShowEpisodeListByAsset } from '@/services/api/dam/videoShowEpisodeApi'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import VideoShowEpisodeListItem from '@/views/dam/asset/detail/components/videoShow/VideoShowEpisodeListItem.vue'
import { loadLazyVideoShow } from '@/views/dam/videoShow/composables/lazyVideoShow'
import VideoShowEpisodeNewDialog from '@/views/dam/asset/detail/components/videoShow/VideoShowEpisodeNewDialog.vue'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetId: DocId
  }>(),
  {}
)

const pagination = usePagination()
pagination.sortBy = 'position'
const filter = useVideoShowEpisodeListFilter()

const { showPagination } = usePaginationAutoHide(pagination)

const listItems = ref<VideoShowEpisode[]>([])
const loading = ref(false)

const dialogNew = ref(false)

const reloadList = () => {
  getList()
}

const addNew = async () => {
  dialogNew.value = true
}

const { addToLazyVideoShowBuffer, fetchLazyVideoShow } = loadLazyVideoShow()

const getList = async () => {
  loading.value = true
  const items = await fetchVideoShowEpisodeListByAsset(props.assetId, pagination, filter)
  const videoShowIds = []
  items.forEach((item) => {
    if (item.videoShow) {
      videoShowIds.push(item.videoShow)
      addToLazyVideoShowBuffer(item.videoShow)
    }
  })
  if (videoShowIds.length > 0) fetchLazyVideoShow()
  listItems.value = items
  loading.value = false
}

onMounted(async () => {
  await getList()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn color="secondary" variant="flat" @click.stop="addNew">Add asset to new Video show episode</VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div v-if="loading" class="d-flex w-100 h-100 justify-center align-center pa-2">
    <VProgressCircular indeterminate color="primary" />
  </div>
  <div v-else-if="listItems.length === 0" class="pa-4 text-caption">Nothing to show</div>
  <div v-else>
    <VideoShowEpisodeListItem v-for="item in listItems" :key="item.id" :item="item" />
    <ADatatablePagination v-if="showPagination" v-model="pagination" hide-records-per-page @change="getList" />
  </div>
  <VideoShowEpisodeNewDialog v-model="dialogNew" :asset-id="assetId" @reload-list="reloadList" />
</template>
