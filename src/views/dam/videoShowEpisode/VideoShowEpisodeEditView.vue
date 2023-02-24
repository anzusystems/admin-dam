<script lang="ts" setup>
import { AActionSaveAndCloseButton, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useVideoShowEpisodeEditActions } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeActions'
import VideoShowEpisodeEditForm from '@/views/dam/videoShowEpisode/components/VideoShowEpisodeEditForm.vue'

const { t } = useI18n()

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
  <ActionbarTitleWrapper :heading="t('coreDam.videoShowEpisode.meta.edit')" />
  <ActionbarButtonsWrapper>
    <AActionSaveButton
      v-if="!detailLoading"
      :loading="saveButtonLoading"
      :disabled="saveAndCloseButtonLoading"
      @save-record="onUpdate"
    />
    <AActionSaveAndCloseButton
      v-if="!detailLoading"
      :loading="saveAndCloseButtonLoading"
      :disabled="saveButtonLoading"
      @save-record-and-close="onUpdate(true)"
    />
    <VBtn class="ml-2" :to="closeRoute" icon="mdi-close" size="small" variant="outlined" :width="36" :height="36" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <VideoShowEpisodeEditForm />
  </ACard>
</template>
