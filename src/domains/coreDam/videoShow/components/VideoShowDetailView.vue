<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import VideoShowDetail from '@/domains/coreDam/videoShow/components/VideoShowDetail.vue'
import { useVideoShowDetailActions } from '@/domains/coreDam/videoShow/composables/videoShowActions'
import { VideoShowDetailTab, useVideoShowDetailTab } from '@/domains/coreDam/videoShow/composables/videoShowDetailTab'
import VideoShowEpisodeCreateButton from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeCreateButton.vue'
import VideoShowEpisodeDatatable from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeDatatable.vue'
import { useVideoShowEpisodeListActions } from '@/domains/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, videoShow } = useVideoShowDetailActions()
const { listLoading } = useVideoShowEpisodeListActions()

const route = useRoute()
const videoShowId = (route.params as { id: string }).id.toString()

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

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/video-shows',
  skipRouteNames: [
    '/(coreDam)/video-shows/[id]/edit',
    '/(coreDam)/video-shows/[id]/episodes/[episodeId]',
    '/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit',
  ],
  loading: detailLoading,
})

// The episode list fetches by the route's id as well: only once the video show is there, or a failed
// load would raise a second alert.
const videoShowLoaded = ref(false)

onMounted(async () => {
  const loaded = await fetchData(videoShowId, { signal })
  if (loaded === false) await leave()
  videoShowLoaded.value = loaded === true
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.videoShow.list'), routeName: '/(coreDam)/video-shows' },
    {
      title: videoShow.value.texts.title || t('breadcrumb.coreDam.videoShow.detail'),
      routeName: '/(coreDam)/video-shows/[id]',
      routeParams: { id: videoShowId },
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
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
          :route-name="'/(coreDam)/video-shows/[id]/edit'"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/video-shows'"
        :skip-route-names="[
          '/(coreDam)/video-shows/[id]/edit',
          '/(coreDam)/video-shows/[id]/episodes/[episodeId]',
          '/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit',
        ]"
      />
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
      <ACard :loading="detailLoading || listLoading">
        <VCardText>
          <VideoShowEpisodeDatatable
            v-if="videoShowLoaded && loadVideoShowEpisodeDatatable"
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
