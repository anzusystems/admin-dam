<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AActionCloseButton, AActionDeleteButton, AActionEditButton, ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import {
  useVoiceFamilyDetailActions,
  useVoiceFamilyRemoveActions,
} from '@/domains/coreDam/voiceFamily/composables/voiceFamilyActions'
import VoiceFamilyDetail from '@/domains/coreDam/voiceFamily/components/VoiceFamilyDetail.vue'
import VoiceBindingsList from '@/domains/coreDam/voiceFamily/components/VoiceBindingsList.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { detailLoading, fetchData, resetStore, voiceFamily } = useVoiceFamilyDetailActions()
const { removeVoiceFamily } = useVoiceFamilyRemoveActions()

const route = useRoute()
const id = (route.params as { id: string }).id.toString()
const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.voiceFamily.list'), routeName: '/(coreDam)/voice-families' },
    {
      title: voiceFamily.value.displayName || t('breadcrumb.coreDam.voiceFamily.detail'),
      routeName: '/(coreDam)/voice-families/[id]',
      routeParams: { id },
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_UPDATE">
        <AActionEditButton
          v-if="!detailLoading"
          :record-id="id"
          :route-name="'/(coreDam)/voice-families/[id]/edit'"
        />
      </Acl>
      <Acl :permission="ACL.DAM_TTS_VOICE_FAMILY_DELETE">
        <AActionDeleteButton
          v-if="!detailLoading"
          data-cy="button-delete"
          @delete-record="removeVoiceFamily(id)"
        />
      </Acl>
      <AActionCloseButton :route-name="'/(coreDam)/voice-families'" />
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
        <div class="text-headline-small mb-2">
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
