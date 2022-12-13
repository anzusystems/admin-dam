<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import AEditButton from '@/components/common/buttons/action/AEditButton.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { usePodcastEpisodeDetailActions } from '@/views/dam/podcastEpisode/composables/podcastEpisodeActions'
import PodcastEpisodeDetail from '@/views/dam/podcastEpisode/components/PodcastEpisodeDetail.vue'

const { loaded, fetchData, resetStore, podcastEpisode } = usePodcastEpisodeDetailActions()

const route = useRoute()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

const { t } = useI18n({ useScope: 'global' })

const closeRoute = computed(() => {
  if (podcastEpisode.value.podcast) {
    return { name: ROUTE.DAM.PODCAST.DETAIL, params: { id: podcastEpisode.value.podcast } }
  }
  return { name: ROUTE.DAM.PODCAST.LIST }
})

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.podcastEpisode.meta.detail')" icon="mdi-file-key-outline" />
  <ActionbarButtonsWrapper>
    <AEditButton v-if="loaded" :record-id="id" :route-name="ROUTE.DAM.PODCAST_EPISODE.EDIT"></AEditButton>
    <VBtn
      class="ml-2"
      :to="closeRoute"
      icon="mdi-close"
      size="small"
      variant="outlined"
      :width="36"
      :height="36"
      data-cy="button-close"
    ></VBtn>
  </ActionbarButtonsWrapper>
  <PodcastEpisodeDetail></PodcastEpisodeDetail>
</template>
