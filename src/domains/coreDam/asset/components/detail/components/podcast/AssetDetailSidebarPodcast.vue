<script lang="ts" setup>
import { ADatatablePagination, usePagination, usePaginationAutoHide } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import type { PodcastEpisode } from '@/domains/coreDam/podcastEpisode/types/PodcastEpisode'
import { usePodcastEpisodeListFilter } from '@/domains/coreDam/podcastEpisode/filter/PodcastEpisodeFilter'
import { fetchPodcastEpisodeListByAsset } from '@/domains/coreDam/podcastEpisode/api/podcastEpisodeApi'
import PodcastEpisodeListItem from '@/domains/coreDam/asset/components/detail/components/podcast/PodcastEpisodeListItem.vue'
import PodcastEpisodeNewDialog from '@/domains/coreDam/asset/components/detail/components/podcast/PodcastEpisodeNewDialog.vue'
import { usePodcastEpisodeRemoveActions } from '@/domains/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { useCachedPodcasts } from '@/domains/coreDam/podcast/composables/cachedPodcasts'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    dataCy?: string
    assetId: DocId
  }>(),
  {
    dataCy: undefined,
  }
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
    <ABtnPrimary
      data-cy="button-add-new-podcast-episode"
      @click.stop="addNew"
    >
      {{ t('coreDam.podcastEpisode.common.addAssetToNewPodcastEpisode') }}
    </ABtnPrimary>
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
    class="pa-4 text-body-small"
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
