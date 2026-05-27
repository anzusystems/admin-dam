<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { useVideoShowDetailActions } from '@/domains/coreDam/videoShow/composables/videoShowActions'
import VideoShowDetail from '@/domains/coreDam/videoShow/components/VideoShowDetail.vue'
import { useVideoShowDetailTab, VideoShowDetailTab } from '@/domains/coreDam/videoShow/composables/videoShowDetailTab'
import VideoShowEpisodeDatatable from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeDatatable.vue'
import VideoShowEpisodeCreateButton from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeCreateButton.vue'
import { useVideoShowEpisodeListActions } from '@/domains/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

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
      <AActionCloseButton :route-name="'/(coreDam)/video-shows'" />
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
