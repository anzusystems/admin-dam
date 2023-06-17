<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { useVideoShowDetailActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import VideoShowDetail from '@/views/coreDam/videoShow/components/VideoShowDetail.vue'
import { useVideoShowDetailTab, VideoShowDetailTab } from '@/views/coreDam/videoShow/composables/videoShowDetailTab'
import VideoShowEpisodeDatatable from '@/views/coreDam/videoShowEpisode/components/VideoShowEpisodeDatatable.vue'
import VideoShowEpisodeCreateButton from '@/views/coreDam/videoShowEpisode/components/VideoShowEpisodeCreateButton.vue'
import { useVideoShowEpisodeListActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import { ACL } from '@/types/Permission'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, videoShow } = useVideoShowDetailActions()
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
  <ActionbarWrapper :last-breadcrumb-title="videoShow.texts.title">
    <template #buttons>
      <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_CREATE">
        <VideoShowEpisodeCreateButton
          v-show="activeTab === VideoShowDetailTab.Episodes"
          v-if="!detailLoading"
          data-cy="button-create"
          :video-show-id="videoShowId"
          @on-success="afterVideoShowEpisodeCreate"
        />
      </Acl>
      <Acl :permission="ACL.DAM_VIDEO_SHOW_UPDATE">
        <AActionEditButton
          v-show="activeTab === VideoShowDetailTab.Detail"
          v-if="!detailLoading"
          :record-id="videoShowId"
          :route-name="ROUTE.DAM.VIDEO_SHOW.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.VIDEO_SHOW.LIST" />
    </template>
  </ActionbarWrapper>

  <VTabs
    v-model="activeTab"
    class="mb-4"
  >
    <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_UI">
      <VTab
        :value="VideoShowDetailTab.Episodes"
        data-cy="episode-list"
      >
        {{ t('coreDam.videoShow.tabs.episodes') }}
      </VTab>
    </Acl>
    <VTab
      :value="VideoShowDetailTab.Detail"
      data-cy="videoShow-list"
    >
      {{ t('coreDam.videoShow.tabs.detail') }}
    </VTab>
  </VTabs>
  <Acl :permission="ACL.DAM_VIDEO_SHOW_EPISODE_UI">
    <div v-show="activeTab === VideoShowDetailTab.Episodes">
      <ACard :loading="listLoading">
        <VCardText>
          <VideoShowEpisodeDatatable
            v-if="loadVideoShowEpisodeDatatable"
            :video-show-id="videoShowId"
          />
        </VCardText>
      </ACard>
    </div>
  </Acl>
  <div v-show="activeTab === VideoShowDetailTab.Detail">
    <ACard :loading="detailLoading">
      <VCardText>
        <VideoShowDetail />
      </VCardText>
    </ACard>
  </div>
</template>
