<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useVideoShowEpisodeEditActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import VideoShowEpisodeEditForm from '@/views/coreDam/videoShowEpisode/components/VideoShowEpisodeEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute('/(coreDam)/video-show/[id]/episode/[episodeId]/edit')
const id = route.params.episodeId.toString()
const videoShowId = route.params.id.toString()

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

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.videoShow.list'), routeName: '/(coreDam)/video-show' },
    {
      title: t('breadcrumb.coreDam.videoShow.detail'),
      routeName: '/(coreDam)/video-show/[id]',
      routeParams: { id: videoShowId },
    },
    {
      title: videoShowEpisode.value.texts.title || t('breadcrumb.coreDam.videoShowEpisode.edit'),
      routeName: '/(coreDam)/video-show/[id]/episode/[episodeId]/edit',
      routeParams: { id: videoShowId, episodeId: id },
    },
  ])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton
        :route-name="'/(coreDam)/video-show/[id]'"
        :route-params="{ id: videoShowId }"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEpisodeEditForm />
    </VCardText>
  </ACard>
</template>
