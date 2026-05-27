<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { usePodcastEpisodeEditActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import PodcastEpisodeEditForm from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const podcastId = (route.params as { id: string }).id.toString()
const id = (route.params as { episodeId: string }).episodeId.toString()

const { detailLoading, fetchData, resetStore, onUpdate, saveButtonLoading, saveAndCloseButtonLoading, podcastEpisode } =
  usePodcastEpisodeEditActions()

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
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
      title: podcastEpisode.value.texts.title || t('common.system.breadcrumb.edit'),
      routeName: '/(coreDam)/podcasts/[id]/episodes/[episodeId]/edit',
      routeParams: { id: podcastId, episodeId: id },
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="'/(coreDam)/podcasts/[id]'" :route-params="{ id: podcastId }" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PodcastEpisodeEditForm />
    </VCardText>
  </ACard>
</template>
