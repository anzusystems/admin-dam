<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import ACard from '@/components/common/ACard.vue'

const { loaded, fetchData, resetStore } = usePodcastDetailActions()

const route = useRoute()
const podcastId = route.params.id.toString()

const loadPodcastEpisodeDatatable = ref(false)
const { activeTab } = usePodcastDetailTab()

watch(
  activeTab,
  (newValue) => {
    if (newValue === PodcastDetailTab.Episodes) {
      loadPodcastEpisodeDatatable.value = true
    }
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

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.podcast.meta.detail')" icon="mdi-podcast" />
  <ActionbarButtonsWrapper>
    <PodcastEpisodeCreateButton
      v-if="loaded"
      data-cy="button-create"
      button-t="coreDam.podcastEpisode.button.create"
      :podcast-id="podcastId"
    />
    <AEditButton v-if="loaded" :record-id="podcastId" :route-name="ROUTE.DAM.PODCAST.EDIT" />
    <ACloseButton :route-name="ROUTE.DAM.PODCAST.LIST" />
  </ActionbarButtonsWrapper>
  <VTabs v-model="activeTab" class="mb-4">
    <VTab :value="PodcastDetailTab.Detail" data-cy="podcast-list">{{ t('coreDam.podcast.tabs.detail') }}</VTab>
    <VTab :value="PodcastDetailTab.Episodes" data-cy="episode-list">{{ t('coreDam.podcast.tabs.episodes') }}</VTab>
  </VTabs>
  <div v-show="activeTab === PodcastDetailTab.Detail">
    <PodcastDetail />
  </div>
  <div v-show="activeTab === PodcastDetailTab.Episodes">
    <ACard loader="list">
      <PodcastEpisodeDatatable v-if="loadPodcastEpisodeDatatable" :podcast-id="podcastId" />
    </ACard>
  </div>
</template>
