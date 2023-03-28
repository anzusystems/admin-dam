<script lang="ts" setup>
import { AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useVideoShowEpisodeEditActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import VideoShowEpisodeEditForm from '@/views/coreDam/videoShowEpisode/components/VideoShowEpisodeEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = route.params.id.toString()

const {
  detailLoading,
  fetchData,
  resetStore,
  onUpdate,
  videoShowEpisode,
  saveButtonLoading,
  saveAndCloseButtonLoading,
} = useVideoShowEpisodeEditActions()

const getData = () => {
  fetchData(id)
}

const closeRoute = computed(() => {
  if (videoShowEpisode.value.videoShow) {
    return { name: ROUTE.DAM.VIDEO_SHOW.DETAIL, params: { id: videoShowEpisode.value.videoShow } }
  }
  return { name: ROUTE.DAM.VIDEO_SHOW.LIST }
})

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <VBtn
        class="ml-2"
        :to="closeRoute"
        icon="mdi-close"
        size="small"
        variant="outlined"
        :width="36"
        :height="36"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEpisodeEditForm />
    </VCardText>
  </ACard>
</template>
