<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { AActionCloseButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { useVideoShowEpisodeDetailActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import VideoShowEpisodeDetail from '@/views/coreDam/videoShowEpisode/components/VideoShowEpisodeDetail.vue'
import { ACL } from '@/types/Permission'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, videoShowEpisode } = useVideoShowEpisodeDetailActions()

const route = useRoute()
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
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="videoShowEpisode.texts.title">
    <template #buttons>
      <Acl :permission="ACL.DAM_VIDEO_SHOW_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :route-params="{ id: videoShowId, episodeId: id }"
          :route-name="ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT"
        />
      </Acl>
      <AActionCloseButton
        :route-name="ROUTE.DAM.VIDEO_SHOW.DETAIL"
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
