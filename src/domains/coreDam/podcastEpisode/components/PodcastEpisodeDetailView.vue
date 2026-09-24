<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  useI18n,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PodcastEpisodeDetail from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeDetail.vue'
import {
  usePodcastEpisodeDetailActions,
  usePodcastEpisodeRemoveActions,
} from '@/domains/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, podcastEpisode } = usePodcastEpisodeDetailActions()
const { deletePodcast } = usePodcastEpisodeRemoveActions()

const route = useRoute()
const router = useRouter()
const podcastId = (route.params as { id: string }).id.toString()
const id = (route.params as { episodeId: string }).episodeId.toString()

const getDetail = () => {
  fetchData(id)
}

const onSuccessfulCallback = () => {
  if (podcastEpisode.value.podcast) {
    router.push({ name: '/(coreDam)/podcasts/[id]', params: { id: podcastEpisode.value.podcast } })
    return
  }
  router.push({ name: '/(coreDam)/podcasts' })
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
      title: t('breadcrumb.coreDam.podcast.detail'),
      routeName: '/(coreDam)/podcasts/[id]',
      routeParams: { id: podcastId },
    },
    {
      title: podcastEpisode.value.texts.title || t('breadcrumb.coreDam.podcastEpisode.detail'),
      routeName: '/(coreDam)/podcasts/[id]/episodes/[episodeId]',
      routeParams: { id: podcastId, episodeId: id },
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_PODCAST_EPISODE_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: podcastId, episodeId: id }"
          :route-name="'/(coreDam)/podcasts/[id]/episodes/[episodeId]/edit'"
        />
      </Acl>
      <Acl :permission="ACL.DAM_PODCAST_EPISODE_DELETE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="deletePodcast(id, onSuccessfulCallback)"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/podcasts/[id]'"
        :fallback-route-params="{ id: podcastId }"
        :skip-route-names="['/(coreDam)/podcasts/[id]/episodes/[episodeId]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PodcastEpisodeDetail />
    </VCardText>
  </ACard>
</template>
