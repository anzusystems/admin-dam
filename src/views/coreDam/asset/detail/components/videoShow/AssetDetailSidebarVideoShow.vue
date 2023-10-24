<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import { ADatatablePagination, usePagination, usePaginationAutoHide } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import { useVideoShowEpisodeListFilter } from '@/model/coreDam/filter/VideoShowEpisodeFilter'
import { fetchVideoShowEpisodeListByAsset } from '@/services/api/coreDam/videoShowEpisodeApi'
import VideoShowEpisodeListItem from '@/views/coreDam/asset/detail/components/videoShow/VideoShowEpisodeListItem.vue'
import VideoShowEpisodeNewDialog from '@/views/coreDam/asset/detail/components/videoShow/VideoShowEpisodeNewDialog.vue'
import { useI18n } from 'vue-i18n'
import { useCachedVideoShows } from '@/views/coreDam/videoShow/composables/cachedVideoShow'

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

const { addToCachedVideoShows, fetchCachedVideoShows } = useCachedVideoShows()

const getList = async () => {
  loading.value = true
  const items = await fetchVideoShowEpisodeListByAsset(props.assetId, pagination, filter)
  addToCachedVideoShows(items.map((item) => item.videoShow))
  fetchCachedVideoShows()
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
      data-cy="button-add-new-vs-episode"
      @click.stop="addNew"
    >
      {{ t('coreDam.videoShowEpisode.common.addAssetToNewVideoShowEpisode') }}
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
    class="pa-4 text-caption"
  >
    {{ t('coreDam.videoShowEpisode.common.noEntries') }}
  </div>
  <div v-else>
    <VideoShowEpisodeListItem
      v-for="item in listItems"
      :key="item.id"
      :item="item"
    />
    <ADatatablePagination
      v-if="showPagination"
      v-model="pagination"
      hide-records-per-page
      @change="getList"
    />
  </div>
  <VideoShowEpisodeNewDialog
    v-model="dialogNew"
    :asset-id="assetId"
    @reload-list="reloadList"
  />
</template>
