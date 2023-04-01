<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import { ADatatablePagination, usePagination, usePaginationAutoHide } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import { usePodcastEpisodeListFilter } from '@/model/coreDam/filter/PodcastEpisodeFilter'
import { fetchPodcastEpisodeListByAsset } from '@/services/api/coreDam/podcastEpisodeApi'
import PodcastEpisodeListItem from '@/views/coreDam/asset/detail/components/podcast/PodcastEpisodeListItem.vue'
import PodcastEpisodeNewDialog from '@/views/coreDam/asset/detail/components/podcast/PodcastEpisodeNewDialog.vue'
import { usePodcastEpisodeRemoveActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { useI18n } from 'vue-i18n'
import { useCachedPodcasts } from '@/views/coreDam/podcast/composables/cachedPodcasts'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetId: DocId
  }>(),
  {}
)

const { t } = useI18n()
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

const { addToCachedPodcasts, fetchCachedPodcasts } = useCachedPodcasts()
const { deletePodcast } = usePodcastEpisodeRemoveActions()

const deletePodcastEpisode = (id: DocId) => {
  deletePodcast(id, reloadList)
}

const getList = async () => {
  loading.value = true
  const items = await fetchPodcastEpisodeListByAsset(props.assetId, pagination, filter)
  addToCachedPodcasts(items.map((item) => item.podcast))
  fetchCachedPodcasts()
  listItems.value = items
  loading.value = false
}

onMounted(async () => {
  await getList()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn
      color="secondary"
      variant="flat"
      @click.stop="addNew"
    >
      {{ t('coreDam.podcastEpisode.common.addAssetToNewPodcastEpisode') }}
    </VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div
    v-if="loading"
    class="d-flex w-100 h-100 justify-center align-center pa-2"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>
  <div
    v-else-if="listItems.length === 0"
    class="pa-4 text-caption"
  >
    {{ t('coreDam.podcastEpisode.common.noEntries') }}
  </div>
  <div v-else>
    <PodcastEpisodeListItem
      v-for="item in listItems"
      :key="item.id"
      :item="item"
      @delete-record="deletePodcastEpisode"
    />
    <ADatatablePagination
      v-if="showPagination"
      v-model="pagination"
      hide-records-per-page
      @change="getList"
    />
  </div>
  <PodcastEpisodeNewDialog
    v-model="dialogNew"
    :asset-id="assetId"
    @reload-list="reloadList"
  />
</template>
