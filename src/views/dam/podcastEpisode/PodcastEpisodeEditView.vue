<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import ASaveButton from '@/components/common/buttons/action/ASaveButton.vue'
import ASaveAndCloseButton from '@/components/common/buttons/action/ASaveAndCloseButton.vue'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { usePodcastEpisodeEditActions } from '@/views/dam/podcastEpisode/composables/podcastEpisodeActions'
import PodcastEpisodeEditForm from '@/views/dam/podcastEpisode/components/PodcastEpisodeEditForm.vue'

const { t } = useI18n({ useScope: 'global' })

const route = useRoute()
const id = route.params.id.toString()

const { loaded, fetchData, resetStore, onUpdate, podcastEpisode } = usePodcastEpisodeEditActions()

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
  <ActionbarTitleWrapper :heading="t('coreDam.podcastEpisode.meta.edit')" icon="mdi-file-key-outline" />
  <ActionbarButtonsWrapper>
    <ASaveButton v-if="loaded" @save-record="onUpdate"></ASaveButton>
    <ASaveAndCloseButton v-if="loaded" @save-record-and-close="onUpdate(true)"></ASaveAndCloseButton>
    <VBtn
      class="ml-2"
      :to="closeRoute"
      icon="mdi-close"
      size="small"
      variant="outlined"
      :width="36"
      :height="36"
    ></VBtn>
  </ActionbarButtonsWrapper>
  <ACard loader="edit">
    <PodcastEpisodeEditForm></PodcastEpisodeEditForm>
  </ACard>
</template>
