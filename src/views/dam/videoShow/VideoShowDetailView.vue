<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useVideoShowDetailActions } from '@/views/dam/videoShow/composables/videoShowActions'
import VideoShowDetail from '@/views/dam/videoShow/components/VideoShowDetail.vue'
import { useVideoShowDetailTab, VideoShowDetailTab } from '@/views/dam/videoShow/composables/videoShowDetailTab'
import VideoShowEpisodeDatatable from '@/views/dam/videoShowEpisode/components/VideoShowEpisodeDatatable.vue'
import VideoShowEpisodeCreateButton from '@/views/dam/videoShowEpisode/components/VideoShowEpisodeCreateButton.vue'
import { useVideoShowEpisodeListActions } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeActions'
import { ACL } from '@/types/Permission'

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
  <ActionbarTitleWrapper :heading="t('coreDam.videoShow.meta.detail')" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_CREATE">
      <VideoShowEpisodeCreateButton
        v-if="!detailLoading"
        data-cy="button-create"
        button-t="coreDam.videoShowEpisode.button.create"
        :video-show-id="videoShowId"
        disable-redirect
        @after-create="afterVideoShowEpisodeCreate"
      />
    </Acl>
    <Acl :permission="ACL.DAM_VIDEO_SHOW_UPDATE">
      <AActionEditButton v-if="!detailLoading" :record-id="videoShowId" :route-name="ROUTE.DAM.VIDEO_SHOW.EDIT" />
    </Acl>
    <AActionCloseButton :route-name="ROUTE.DAM.VIDEO_SHOW.LIST" />
  </ActionbarButtonsWrapper>
  <VTabs v-model="activeTab" class="mb-4">
    <VTab :value="VideoShowDetailTab.Detail" data-cy="videoShow-list">{{ t('coreDam.videoShow.tabs.detail') }}</VTab>
    <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_UI">
      <VTab :value="VideoShowDetailTab.Episodes" data-cy="episode-list">{{
        t('coreDam.videoShow.tabs.episodes')
      }}</VTab>
    </Acl>
  </VTabs>
  <div v-show="activeTab === VideoShowDetailTab.Detail">
    <ACard :loading="detailLoading">
      <VideoShowDetail />
    </ACard>
  </div>
  <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_UI">
    <div v-show="activeTab === VideoShowDetailTab.Episodes">
      <ACard :loading="listLoading">
        <VideoShowEpisodeDatatable v-if="loadVideoShowEpisodeDatatable" :video-show-id="videoShowId" />
      </ACard>
    </div>
  </Acl>
</template>
