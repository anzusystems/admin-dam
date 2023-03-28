<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { usePodcastEditActions } from '@/views/coreDam/podcast/composables/podcastActions'
import PodcastEditForm from '@/views/coreDam/podcast/components/PodcastEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

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
  <ActionbarWrapper>
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="ROUTE.DAM.PODCAST.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <PodcastEditForm />
    </VCardText>
  </ACard>
</template>
