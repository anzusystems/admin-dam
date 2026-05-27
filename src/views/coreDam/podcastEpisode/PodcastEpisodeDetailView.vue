<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionDeleteButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
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
const podcastId = route.params.id.toString()
const id = route.params.episodeId.toString()

const getDetail = () => {
  fetchData(id)
}

const closeRoute = computed(() => {
  if (podcastEpisode.value.podcast) {
    return { name: '/(coreDam)/podcast/[id]', params: { id: podcastEpisode.value.podcast } }
  }
  return { name: '/(coreDam)/podcast' }
})

const onSuccessfulCallback = () => {
  router.push(closeRoute.value)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="podcastEpisode.texts.title">
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
