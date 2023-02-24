<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionDeleteButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import {
  usePodcastEpisodeDetailActions,
  usePodcastEpisodeRemoveActions,
} from '@/views/dam/podcastEpisode/composables/podcastEpisodeActions'
import PodcastEpisodeDetail from '@/views/dam/podcastEpisode/components/PodcastEpisodeDetail.vue'

const { detailLoading, fetchData, resetStore, podcastEpisode } = usePodcastEpisodeDetailActions()
const { deletePodcast } = usePodcastEpisodeRemoveActions()

const route = useRoute()
const router = useRouter()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

const { t } = useI18n()

const closeRoute = computed(() => {
  if (podcastEpisode.value.podcast) {
    return { name: ROUTE.DAM.PODCAST.DETAIL, params: { id: podcastEpisode.value.podcast } }
  }
  return { name: ROUTE.DAM.PODCAST.LIST }
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
  <ActionbarTitleWrapper :heading="t('coreDam.podcastEpisode.meta.detail')" />
  <ActionbarButtonsWrapper>
    <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.PODCAST_EPISODE.EDIT" />
    <AActionDeleteButton
      v-if="!detailLoading"
      variant="outlined"
      color="error"
      :width="36"
      :height="36"
      @delete-record="deletePodcast(id, onSuccessfulCallback)"
    />
    <VBtn
      class="ml-2"
      :to="closeRoute"
      icon="mdi-close"
      size="small"
      variant="outlined"
      :width="36"
      :height="36"
      data-cy="button-close"
    >
      <VIcon icon="mdi-close" />
      <VTooltip activator="parent" location="bottom">Close</VTooltip>
    </VBtn>
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <PodcastEpisodeDetail />
  </ACard>
</template>
