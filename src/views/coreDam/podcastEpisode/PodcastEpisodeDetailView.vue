<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import {
  AActionCloseButton,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  useI18n,
} from '@anzusystems/common-admin'
import {
  usePodcastEpisodeDetailActions,
  usePodcastEpisodeRemoveActions,
} from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import PodcastEpisodeDetail from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeDetail.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

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
    router.push({ name: '/(coreDam)/podcast/[id]', params: { id: podcastEpisode.value.podcast } })
    return
  }
  router.push({ name: '/(coreDam)/podcast' })
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
    { title: t('breadcrumb.coreDam.podcast.list'), routeName: '/(coreDam)/podcast' },
    {
      title: t('breadcrumb.coreDam.podcast.detail'),
      routeName: '/(coreDam)/podcast/[id]',
      routeParams: { id: podcastId },
    },
    {
      title: podcastEpisode.value.texts.title || t('breadcrumb.coreDam.podcastEpisode.detail'),
      routeName: '/(coreDam)/podcast/[id]/episode/[episodeId]',
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
          :route-name="'/(coreDam)/podcast/[id]/episode/[episodeId]/edit'"
        />
      </Acl>
      <Acl :permission="ACL.DAM_PODCAST_EPISODE_DELETE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="deletePodcast(id, onSuccessfulCallback)"
        />
      </Acl>
      <AActionCloseButton
        :route-name="'/(coreDam)/podcast/[id]'"
        :route-params="{ id: podcastId }"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PodcastEpisodeDetail />
    </VCardText>
  </ACard>
</template>
