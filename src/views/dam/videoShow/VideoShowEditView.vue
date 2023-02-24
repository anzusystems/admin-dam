<script lang="ts" setup>
import { AActionCloseButton, AActionSaveAndCloseButton, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { useVideoShowEditActions } from '@/views/dam/videoShow/composables/videoShowActions'
import VideoShowEditForm from '@/views/dam/videoShow/components/VideoShowEditForm.vue'

const { t } = useI18n()

const route = useRoute()
const id = route.params.id.toString()

const { saveButtonLoading, saveAndCloseButtonLoading, detailLoading, fetchData, resetStore, onUpdate } =
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
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.videoShow.meta.edit')" />
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
    <AActionCloseButton :route-name="ROUTE.DAM.VIDEO_SHOW.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <VideoShowEditForm />
  </ACard>
</template>
