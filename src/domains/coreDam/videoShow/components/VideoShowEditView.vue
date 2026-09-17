<script lang="ts" setup>
import { AActionCloseButtonHistory, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useVideoShowEditActions } from '@/domains/coreDam/videoShow/composables/videoShowActions'
import VideoShowEditForm from '@/domains/coreDam/videoShow/components/VideoShowEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { saveButtonLoading, saveAndCloseButtonLoading, detailLoading, fetchData, resetStore, onUpdate, videoShow } =
  useVideoShowEditActions()

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
    { title: t('breadcrumb.coreDam.videoShow.list'), routeName: '/(coreDam)/video-shows' },
    {
      title: videoShow.value.texts.title || t('breadcrumb.coreDam.videoShow.edit'),
      routeName: '/(coreDam)/video-shows/[id]/edit',
      routeParams: { id },
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
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/video-shows'"
        :skip-route-names="[
          '/(coreDam)/video-shows/[id]',
          '/(coreDam)/video-shows/[id]/edit',
          '/(coreDam)/video-shows/[id]/episodes/[episodeId]',
          '/(coreDam)/video-shows/[id]/episodes/[episodeId]/edit',
        ]"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEditForm />
    </VCardText>
  </ACard>
</template>
