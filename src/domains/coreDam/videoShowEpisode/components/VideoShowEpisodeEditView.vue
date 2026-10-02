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

import VideoShowEpisodeEditForm from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeEditForm.vue'
import { useVideoShowEpisodeEditActions } from '@/domains/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute('/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit')
const id = route.params.episodeId.toString()
const videoShowId = route.params.id.toString()

const {
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  videoShowEpisode,
  saveButtonLoading,
  saveAndCloseButtonLoading,
} = useVideoShowEpisodeEditActions()

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/video-shows/[id]',
  fallbackRouteParams: { id: videoShowId },
  skipRouteNames: ['/(coreDam)/video-shows/[id]/episodes/[episodeId]'],
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
    { title: t('breadcrumb.coreDam.videoShow.list'), routeName: '/(coreDam)/video-shows' },
    {
      title: t('breadcrumb.coreDam.videoShow.detail'),
      routeName: '/(coreDam)/video-shows/[id]',
      routeParams: { id: videoShowId },
    },
    {
      title: videoShowEpisode.value.texts.title || t('breadcrumb.coreDam.videoShowEpisode.edit'),
      routeName: '/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit',
      routeParams: { id: videoShowId, episodeId: id },
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
        :fallback-route-name="'/(coreDam)/video-shows/[id]'"
        :fallback-route-params="{ id: videoShowId }"
        :skip-route-names="['/(coreDam)/video-shows/[id]/episodes/[episodeId]']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEpisodeEditForm />
    </VCardText>
  </ACard>
</template>
