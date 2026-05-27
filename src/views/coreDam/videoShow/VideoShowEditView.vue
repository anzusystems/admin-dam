<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { useVideoShowEditActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import VideoShowEditForm from '@/views/coreDam/videoShow/components/VideoShowEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

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
    { title: t('breadcrumb.coreDam.videoShow.list'), routeName: '/(coreDam)/video-show' },
    {
      title: videoShow.value.texts.title || t('breadcrumb.coreDam.videoShow.edit'),
      routeName: '/(coreDam)/video-show/[id]/edit',
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
      <AActionCloseButton :route-name="'/(coreDam)/video-show'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VideoShowEditForm />
    </VCardText>
  </ACard>
</template>
