<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { usePodcastDetailActions } from '@/domains/coreDam/podcast/composables/podcastActions'
import PodcastDetail from '@/domains/coreDam/podcast/components/PodcastDetail.vue'
import { PodcastDetailTab, usePodcastDetailTab } from '@/domains/coreDam/podcast/composables/podcastDetailTab'
import PodcastEpisodeDatatable from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeDatatable.vue'
import PodcastEpisodeCreateButton from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeCreateButton.vue'
import { usePodcastEpisodeListActions } from '@/domains/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { detailLoading, fetchData, resetStore, podcast } = usePodcastDetailActions()
const { listLoading } = usePodcastEpisodeListActions()

const route = useRoute()
const podcastId = (route.params as { id: string }).id.toString()

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

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.podcast.list'), routeName: '/(coreDam)/podcasts' },
    {
      title: podcast.value.texts.title || t('breadcrumb.coreDam.podcast.detail'),
      routeName: '/(coreDam)/podcasts/[id]',
      routeParams: { id: podcastId },
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
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
          :route-name="'/(coreDam)/podcasts/[id]/edit'"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/podcasts'" />
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
