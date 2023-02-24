<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { AActionSaveButton } from '@anzusystems/common-admin'
import { AActionSaveAndCloseButton } from '@anzusystems/common-admin'
import { AActionCloseButton } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import { usePodcastEditActions } from '@/views/dam/podcast/composables/podcastActions'
import PodcastEditForm from '@/views/dam/podcast/components/PodcastEditForm.vue'

const { t } = useI18n()

const route = useRoute()
const id = route.params.id.toString()

const { saveButtonLoading, saveAndCloseButtonLoading, detailLoading, fetchData, resetStore, onUpdate } =
  usePodcastEditActions()

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
  <ActionbarTitleWrapper :heading="t('coreDam.podcast.meta.edit')" />
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
    <AActionCloseButton :route-name="ROUTE.DAM.PODCAST.LIST" />
  </ActionbarButtonsWrapper>
  <ACard :loading="detailLoading">
    <PodcastEditForm />
  </ACard>
</template>
