<script lang="ts" setup>
import { AActionCloseButton, AActionEditButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useVideoShowEpisodeDetailActions } from '@/domains/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import VideoShowEpisodeDetail from '@/domains/coreDam/videoShowEpisode/components/VideoShowEpisodeDetail.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { detailLoading, fetchData, resetStore, videoShowEpisode } = useVideoShowEpisodeDetailActions()

const route = useRoute('/(coreDam)/video-shows/[id]/episodes/[episodeId]')
const id = route.params.episodeId.toString()
const videoShowId = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
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
      <AActionCloseButton
        :route-name="'/(coreDam)/video-shows/[id]'"
        :route-params="{ id: videoShowId }"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEpisodeDetail />
    </VCardText>
  </ACard>
</template>
