<script lang="ts" setup>
import { AActionCloseButtonHistory, AActionSaveButton, ACard } from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useVoiceFamilyEditActions } from '@/domains/coreDam/voiceFamily/composables/voiceFamilyActions'
import VoiceFamilyEditForm from '@/domains/coreDam/voiceFamily/components/VoiceFamilyEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = (route.params as { id: string }).id.toString()

const { detailLoading, saveButtonLoading, fetchData, resetStore, onUpdate, voiceFamily } = useVoiceFamilyEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.voiceFamily.list'), routeName: '/(coreDam)/voice-families' },
    {
      title: voiceFamily.value.displayName || t('breadcrumb.coreDam.voiceFamily.edit'),
      routeName: '/(coreDam)/voice-families/[id]/edit',
      routeParams: { id },
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        @save-record="onUpdate"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/voice-families'"
        :skip-route-names="['/(coreDam)/voice-families/[id]', '/(coreDam)/voice-families/[id]/edit']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VoiceFamilyEditForm />
    </VCardText>
  </ACard>
</template>
