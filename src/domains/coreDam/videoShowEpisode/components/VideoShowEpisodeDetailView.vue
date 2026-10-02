<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  defineBreadcrumbs,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import VideoShowEpisodeDetail from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeDetail.vue'
import { useVideoShowEpisodeDetailActions } from '@/domains/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, videoShowEpisode } = useVideoShowEpisodeDetailActions()

const route = useRoute('/(coreDam)/video-shows/[id]/episodes/[episodeId]')
const id = route.params.episodeId.toString()
const videoShowId = route.params.id.toString()

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/video-shows/[id]',
  fallbackRouteParams: { id: videoShowId },
  skipRouteNames: ['/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit'],
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
      title: videoShowEpisode.value.texts.title || t('breadcrumb.coreDam.videoShowEpisode.detail'),
      routeName: '/(coreDam)/video-shows/[id]/episodes/[episodeId]',
      routeParams: { id: videoShowId, episodeId: id },
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_VIDEO_SHOW_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: videoShowId, episodeId: id }"
          :route-name="'/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit'"
        />
      </Acl>
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/video-shows/[id]'"
        :fallback-route-params="{ id: videoShowId }"
        :skip-route-names="['/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEpisodeDetail />
    </VCardText>
  </ACard>
</template>
