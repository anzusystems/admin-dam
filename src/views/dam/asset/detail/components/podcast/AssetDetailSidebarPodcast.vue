<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import { usePagination, usePaginationAutoHide } from '@/composables/system/pagination'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import { usePodcastEpisodeListFilter } from '@/model/dam/filter/PodcastEpisodeFilter'
import { fetchPodcastEpisodeListByAsset } from '@/services/api/dam/podcastEpisodeApi'
import ADatatablePagination from '@/components/common/ADatatablePagination.vue'
import PodcastEpisodeListItem from '@/views/dam/asset/detail/components/podcast/PodcastEpisodeListItem.vue'
import { loadLazyPodcast } from '@/views/dam/podcast/composables/lazyPodcast'
import PodcastEpisodeNewDialog from '@/views/dam/asset/detail/components/podcast/PodcastEpisodeNewDialog.vue'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetId: DocId
  }>(),
  {}
)

const pagination = usePagination()
pagination.sortBy = 'position'
const filter = usePodcastEpisodeListFilter()

const { showPagination } = usePaginationAutoHide(pagination)

const listItems = ref<PodcastEpisode[]>([])
const loading = ref(false)

const dialogNew = ref(false)

const reloadList = () => {
  getList()
}

const addNew = async () => {
  dialogNew.value = true
}

const { addToLazyPodcastBuffer, fetchLazyPodcast } = loadLazyPodcast()

const getList = async () => {
  loading.value = true
  const items = await fetchPodcastEpisodeListByAsset(props.assetId, pagination, filter)
  const podcastIds = []
  items.forEach((item) => {
    if (item.podcast) {
      podcastIds.push(item.podcast)
      addToLazyPodcastBuffer(item.podcast)
    }
  })
  if (podcastIds.length > 0) fetchLazyPodcast()
  listItems.value = items
  loading.value = false
}

onMounted(async () => {
  await getList()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn color="secondary" @click.stop="addNew" variant="flat">Add asset to new podcast episode</VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div v-if="loading" class="d-flex w-100 h-100 justify-center align-center pa-2">
    <VProgressCircular indeterminate color="primary"></VProgressCircular>
  </div>
  <div v-else-if="listItems.length === 0" class="pa-4 text-caption">Nothing to show</div>
  <div v-else>
    <PodcastEpisodeListItem v-for="item in listItems" :key="item.id" :item="item" />
    <ADatatablePagination v-if="showPagination" hide-records-per-page v-model="pagination" @change="getList" />
  </div>
  <PodcastEpisodeNewDialog v-model="dialogNew" :asset-id="assetId" @reload-list="reloadList" />
</template>
