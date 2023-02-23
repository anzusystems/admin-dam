<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionEditButton } from '@anzusystems/common-admin'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useVideoShowDetailActions } from '@/views/dam/videoShow/composables/videoShowActions'
import VideoShowDetail from '@/views/dam/videoShow/components/VideoShowDetail.vue'
import { useVideoShowDetailTab, VideoShowDetailTab } from '@/views/dam/videoShow/composables/videoShowDetailTab'
import VideoShowEpisodeDatatable from '@/views/dam/videoShowEpisode/components/VideoShowEpisodeDatatable.vue'
import VideoShowEpisodeCreateButton from '@/views/dam/videoShowEpisode/components/VideoShowEpisodeCreateButton.vue'
import { ACard } from '@anzusystems/common-admin'
import { useVideoShowEpisodeListActions } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeActions'

const { detailLoading, fetchData, resetStore } = useVideoShowDetailActions()
const { listLoading } = useVideoShowEpisodeListActions()

const route = useRoute()
const videoShowId = route.params.id.toString()

const loadVideoShowEpisodeDatatable = ref(false)
const { activeTab } = useVideoShowDetailTab()

watch(
  activeTab,
  (newValue) => {
    if (newValue === VideoShowDetailTab.Episodes) {
      loadVideoShowEpisodeDatatable.value = true
      return
    }
    loadVideoShowEpisodeDatatable.value = false
  },
  { immediate: true }
)

const getDetail = () => {
  fetchData(videoShowId)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()

const afterVideoShowEpisodeCreate = () => {
  if (activeTab.value === VideoShowDetailTab.Episodes) {
    loadVideoShowEpisodeDatatable.value = false
    nextTick(() => {
      loadVideoShowEpisodeDatatable.value = true
    })
  }
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.videoShow.meta.detail')" icon="mdi-videoShow" />
  <ActionbarButtonsWrapper>
    <VideoShowEpisodeCreateButton
      v-if="!detailLoading"
      data-cy="button-create"
      button-t="coreDam.videoShowEpisode.button.create"
      :video-show-id="videoShowId"
      disable-redirect
      @after-create="afterVideoShowEpisodeCreate"
    />
    <AActionEditButton v-if="!detailLoading" :record-id="videoShowId" :route-name="ROUTE.DAM.VIDEO_SHOW.EDIT" />
    <AActionCloseButton :route-name="ROUTE.DAM.VIDEO_SHOW.LIST" />
  </ActionbarButtonsWrapper>
  <VTabs v-model="activeTab" class="mb-4">
    <VTab :value="VideoShowDetailTab.Detail" data-cy="videoShow-list">{{ t('coreDam.videoShow.tabs.detail') }}</VTab>
    <VTab :value="VideoShowDetailTab.Episodes" data-cy="episode-list">{{ t('coreDam.videoShow.tabs.episodes') }}</VTab>
  </VTabs>
  <div v-show="activeTab === VideoShowDetailTab.Detail">
    <ACard :loading="detailLoading">
      <VideoShowDetail />
    </ACard>
  </div>
  <div v-show="activeTab === VideoShowDetailTab.Episodes">
    <ACard :loading="listLoading">
      <VideoShowEpisodeDatatable v-if="loadVideoShowEpisodeDatatable" :video-show-id="videoShowId" />
    </ACard>
  </div>
</template>
