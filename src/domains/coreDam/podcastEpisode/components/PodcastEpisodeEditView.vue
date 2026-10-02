<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import PodcastEpisodeEditForm from '@/domains/coreDam/podcastEpisode/components/PodcastEpisodeEditForm.vue'
import { usePodcastEpisodeEditActions } from '@/domains/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const podcastId = (route.params as { id: string }).id.toString()
const id = (route.params as { episodeId: string }).episodeId.toString()

const { detailLoading, fetchData, resetStore, onUpdate, saveButtonLoading, saveAndCloseButtonLoading, podcastEpisode } =
  usePodcastEpisodeEditActions()

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/podcasts/[id]',
  fallbackRouteParams: { id: podcastId },
  skipRouteNames: ['/(coreDam)/podcasts/[id]/episodes/[episodeId]'],
  loading: detailLoading,
})

onMounted(async () => {
  if ((await fetchData(id, { signal })) === false) await leave()
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
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/podcasts/[id]'"
        :fallback-route-params="{ id: podcastId }"
        :skip-route-names="['/(coreDam)/podcasts/[id]/episodes/[episodeId]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PodcastEpisodeEditForm />
    </VCardText>
  </ACard>
</template>
