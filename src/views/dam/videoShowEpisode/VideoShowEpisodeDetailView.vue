<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { ROUTE } from '@/router/routes'
import { useI18n } from 'vue-i18n'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { AActionEditButton } from '@anzusystems/common-admin'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useVideoShowEpisodeDetailActions } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeActions'
import VideoShowEpisodeDetail from '@/views/dam/videoShowEpisode/components/VideoShowEpisodeDetail.vue'
import { ACard } from '@anzusystems/common-admin'

const { detailLoading, fetchData, resetStore, videoShowEpisode } = useVideoShowEpisodeDetailActions()

const route = useRoute()
const id = route.params.id.toString()

const getDetail = () => {
  fetchData(id)
}

const { t } = useI18n()

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
  <ActionbarTitleWrapper :heading="t('coreDam.videoShowEpisode.meta.detail')" />
  <ActionbarButtonsWrapper>
    <AActionEditButton v-if="!detailLoading" :record-id="id" :route-name="ROUTE.DAM.VIDEO_SHOW_EPISODE.EDIT" />
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
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <VideoShowEpisodeDetail />
  </ACard>
</template>
