<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ROUTE } from '@/router/routes'
import { useVoiceFamilyEditActions } from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import VoiceFamilyEditForm from '@/views/coreDam/voiceFamily/components/VoiceFamilyEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = route.params.id.toString()

const { detailLoading, saveButtonLoading, fetchData, resetStore, onUpdate, voiceFamily } =
  useVoiceFamilyEditActions()

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
  <ActionbarWrapper :last-breadcrumb-title="voiceFamily.displayName">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButton :route-name="ROUTE.DAM.VOICE_FAMILY.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VoiceFamilyEditForm />
    </VCardText>
  </ACard>
</template>
