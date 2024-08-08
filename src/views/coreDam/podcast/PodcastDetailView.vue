<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import { usePodcastDetailActions } from '@/views/coreDam/podcast/composables/podcastActions'
import PodcastDetail from '@/views/coreDam/podcast/components/PodcastDetail.vue'
import { PodcastDetailTab, usePodcastDetailTab } from '@/views/coreDam/podcast/composables/podcastDetailTab'
import PodcastEpisodeDatatable from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeDatatable.vue'
import PodcastEpisodeCreateButton from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeCreateButton.vue'
import { usePodcastEpisodeListActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, podcast } = usePodcastDetailActions()
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
  <ActionbarWrapper :last-breadcrumb-title="podcast.texts.title">
    <template #buttons>
      <Acl :permission="ACL.DAM_PODCAST_EPISODE_CREATE">
        <PodcastEpisodeCreateButton
          v-show="activeTab === PodcastDetailTab.Episodes"
          v-if="!detailLoading"
          data-cy="button-create"
          :podcast-id="podcastId"
          @on-success="afterPodcastEpisodeCreate"
        />
      </Acl>
      <Acl :permission="ACL.DAM_PODCAST_UPDATE">
        <AActionEditButton
          v-show="activeTab === PodcastDetailTab.Detail"
          v-if="!detailLoading"
          :record-id="podcastId"
          :route-name="ROUTE.DAM.PODCAST.EDIT"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.PODCAST.LIST" />
    </template>
  </ActionbarWrapper>

  <VTabs
    v-model="activeTab"
    class="mb-4"
  >
    <Acl :permission="ACL.DAM_PODCAST_EPISODE_UI">
      <VTab
        :value="PodcastDetailTab.Episodes"
        data-cy="episode-list"
      >
        {{ t('coreDam.podcast.tabs.episodes') }}
      </VTab>
    </Acl>
    <VTab
      :value="PodcastDetailTab.Detail"
      data-cy="podcast-list"
    >
      {{ t('coreDam.podcast.tabs.detail') }}
    </VTab>
  </VTabs>
  <Acl :permission="ACL.DAM_PODCAST_EPISODE_UI">
    <div v-show="activeTab === PodcastDetailTab.Episodes">
      <ACard :loading="listLoading">
        <VCardText>
          <PodcastEpisodeDatatable
            v-if="loadPodcastEpisodeDatatable"
            :podcast-id="podcastId"
          />
        </VCardText>
      </ACard>
    </div>
  </Acl>
  <div v-show="activeTab === PodcastDetailTab.Detail">
    <ACard :loading="detailLoading">
      <VCardText>
        <PodcastDetail />
      </VCardText>
    </ACard>
  </div>
</template>
