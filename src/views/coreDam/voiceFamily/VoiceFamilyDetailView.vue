<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { onBeforeUnmount, onMounted } from 'vue'
import {
  AActionCloseButton,
  AActionDeleteButton,
  AActionEditButton,
  ACard,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { ROUTE } from '@/router/routes'
import {
  useVoiceFamilyDetailActions,
  useVoiceFamilyRemoveActions,
} from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import VoiceFamilyDetail from '@/views/coreDam/voiceFamily/components/VoiceFamilyDetail.vue'
import VoiceBindingsList from '@/views/coreDam/voiceFamily/components/VoiceBindingsList.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const { detailLoading, fetchData, resetStore, voiceFamily } = useVoiceFamilyDetailActions()
const { removeVoiceFamily } = useVoiceFamilyRemoveActions()

const route = useRoute()
const id = route.params.id.toString()
const { t } = useI18n()

const getDetail = () => {
  fetchData(id)
}

onMounted(() => {
  getDetail()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper :last-breadcrumb-title="voiceFamily.displayName">
    <template #buttons>
      <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="ROUTE.DAM.VOICE_FAMILY.EDIT"
        />
      </Acl>
      <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_DELETE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removeVoiceFamily(id)"
        />
      </Acl>
      <AActionCloseButton :route-name="ROUTE.DAM.VOICE_FAMILY.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <VoiceFamilyDetail />
    </VCardText>
  </ACard>

  <Acl :permission="ACL.DAM_TTS_VOICE_READ">
    <ACard class="mt-4">
      <VCardText>
        <div class="text-h6 mb-2">
          {{ t('coreDam.voiceFamily.voices') }}
        </div>
        <VoiceBindingsList
          v-if="!detailLoading"
          :voice-family-id="id"
        />
      </VCardText>
    </ACard>
  </Acl>
</template>
