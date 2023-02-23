<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ACloseButton from '@/components/common/buttons/action/ACloseButton.vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { usePodcastDetailActions } from '@/views/dam/podcast/composables/podcastActions'
import PodcastDetail from '@/views/dam/podcast/components/PodcastDetail.vue'
import { PodcastDetailTab, usePodcastDetailTab } from '@/views/dam/podcast/composables/podcastDetailTab'
import PodcastEpisodeDatatable from '@/views/dam/podcastEpisode/components/PodcastEpisodeDatatable.vue'
import PodcastEpisodeCreateButton from '@/views/dam/podcastEpisode/components/PodcastEpisodeCreateButton.vue'
import { ACard } from '@anzusystems/common-admin'
import { usePodcastEpisodeListActions } from '@/views/dam/podcastEpisode/composables/podcastEpisodeActions'
import { ACL } from '@/types/Permission'

const { detailLoading, fetchData, resetStore } = usePodcastDetailActions()
const { listLoading } = usePodcastEpisodeListActions()

const route = useRoute()
const podcastId = route.params.id.toString()

const loadPodcastEpisodeDatatable = ref(false)
const { activeTab } = usePodcastDetailTab()

watch(
  activeTab,
  (newValue) => {
    if (newValue === PodcastDetailTab.Episodes) {
      loadPodcastEpisodeDatatable.value = true
      return
    }
    loadPodcastEpisodeDatatable.value = false
  },
  { immediate: true }
)

const getDetail = () => {
  fetchData(podcastId)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()

const afterPodcastEpisodeCreate = () => {
  if (activeTab.value === PodcastDetailTab.Episodes) {
    loadPodcastEpisodeDatatable.value = false
    nextTick(() => {
      loadPodcastEpisodeDatatable.value = true
    })
  }
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.podcast.meta.detail')" icon="mdi-podcast" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_PODCAST_EPISODE_CREATE">
      <PodcastEpisodeCreateButton
        v-if="!detailLoading"
        data-cy="button-create"
        button-t="coreDam.podcastEpisode.button.create"
        :podcast-id="podcastId"
        disable-redirect
        @after-create="afterPodcastEpisodeCreate"
      />
    </Acl>
    <Acl :permission="ACL.DAM_PODCAST_UPDATE">
      <AEditButton v-if="!detailLoading" :record-id="podcastId" :route-name="ROUTE.DAM.PODCAST.EDIT" />
    </Acl>
    <ACloseButton :route-name="ROUTE.DAM.PODCAST.LIST" />
  </ActionbarButtonsWrapper>
  <VTabs v-model="activeTab" class="mb-4">
    <VTab :value="PodcastDetailTab.Detail" data-cy="podcast-list">{{ t('coreDam.podcast.tabs.detail') }}</VTab>
    <Acl :permission="ACL.DAM_PODCAST_EPISODE_UI">
      <VTab :value="PodcastDetailTab.Episodes" data-cy="episode-list">{{ t('coreDam.podcast.tabs.episodes') }}</VTab>
    </Acl>
  </VTabs>
  <div v-show="activeTab === PodcastDetailTab.Detail">
    <ACard :loading="detailLoading">
      <PodcastDetail />
    </ACard>
  </div>
  <Acl :permission="ACL.DAM_PODCAST_EPISODE_UI">
    <div v-show="activeTab === PodcastDetailTab.Episodes">
      <ACard :loading="listLoading">
        <PodcastEpisodeDatatable v-if="loadPodcastEpisodeDatatable" :podcast-id="podcastId" />
      </ACard>
    </div>
  </Acl>
</template>
