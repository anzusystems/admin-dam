<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { AActionSaveButton } from '@anzusystems/common-admin'
import { AActionSaveAndCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { usePodcastEpisodeEditActions } from '@/views/dam/podcastEpisode/composables/podcastEpisodeActions'
import PodcastEpisodeEditForm from '@/views/dam/podcastEpisode/components/PodcastEpisodeEditForm.vue'

const { t } = useI18n()

const route = useRoute()
const id = route.params.id.toString()

const { detailLoading, fetchData, resetStore, onUpdate, podcastEpisode, saveButtonLoading, saveAndCloseButtonLoading } =
  usePodcastEpisodeEditActions()

const getData = () => {
  fetchData(id)
}

const closeRoute = computed(() => {
  if (podcastEpisode.value.podcast) {
    return { name: ROUTE.DAM.PODCAST.DETAIL, params: { id: podcastEpisode.value.podcast } }
  }
  return { name: ROUTE.DAM.PODCAST.LIST }
})

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.podcastEpisode.meta.edit')" />
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
    <PodcastEpisodeEditForm />
  </ACard>
</template>
