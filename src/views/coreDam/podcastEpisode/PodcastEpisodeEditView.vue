<script lang="ts" setup>
import { AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { usePodcastEpisodeEditActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import PodcastEpisodeEditForm from '@/views/coreDam/podcastEpisode/components/PodcastEpisodeEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

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
      <PodcastEpisodeEditForm />
    </VCardText>
  </ACard>
</template>
