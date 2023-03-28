<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { AActionEditButton, ACard } from '@anzusystems/common-admin'
import { useVideoShowEpisodeDetailActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import VideoShowEpisodeDetail from '@/views/coreDam/videoShowEpisode/components/VideoShowEpisodeDetail.vue'
import { ACL } from '@/types/Permission'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { detailLoading, fetchData, resetStore, videoShowEpisode } = useVideoShowEpisodeDetailActions()

const route = useRoute()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

const closeRoute = computed(() => {
  if (videoShowEpisode.value.videoShow) {
    return { name: ROUTE.DAM.VIDEO_SHOW.DETAIL, params: { id: videoShowEpisode.value.videoShow } }
  }
  return { name: ROUTE.DAM.VIDEO_SHOW.LIST }
})

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_VIDEO_SHOW_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT"
        />
      </Acl>
      <VBtn
        class="ml-2"
        :to="closeRoute"
        icon="mdi-close"
        size="small"
        variant="outlined"
        :width="36"
        :height="36"
        data-cy="button-close"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEpisodeDetail />
    </VCardText>
  </ACard>
</template>
