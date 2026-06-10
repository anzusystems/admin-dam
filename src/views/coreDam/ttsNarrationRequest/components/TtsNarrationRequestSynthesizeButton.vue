<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ACreateDialog,
  AFormTextarea,
  AFormTextField,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
  DamExtSystemRemoteAutocomplete,
  type IntegerIdNullable,
} from '@anzusystems/common-admin'
import PodcastRemoteAutocomplete from '@/views/coreDam/podcast/components/PodcastRemoteAutocomplete.vue'
import { damClient } from '@/services/api/clients/damClient'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsNarrationRequestApi'
import { useTtsNarrationRequestSynthesizeActions } from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import {
  TTS_SYNTHESIZE_TEXT_MAX,
  useTtsNarrationRequestSynthesizeValidation,
} from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestValidation'
import VoiceFamilySelect from '@/views/coreDam/ttsNarrationRequest/components/VoiceFamilySelect.vue'
import type { TtsSynthesizeRequestDto, TtsSynthesizeResponse } from '@/types/coreDam/TtsNarrationRequest'
import { useTtsSynthesizeRequestDtoFactory } from '@/model/coreDam/factory/TtsSynthesizeRequestDtoFactory'

withDefaults(
  defineProps<{
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)

const emit = defineEmits<{
  (e: 'onSuccess'): void
}>()

const { t } = useI18n()
const { currentExtSystemId } = useCurrentExtSystem()
const { synthesize } = useTtsNarrationRequestSynthesizeActions()
const { createDefault } = useTtsSynthesizeRequestDtoFactory()

const dialog = ref(false)
const dto = ref<TtsSynthesizeRequestDto>(createDefault())
// UI-only: scopes the licence/voice pickers, derived from the licence on the BE so it is not sent.
const extSystemId = ref<IntegerIdNullable>(null)

const { v$ } = useTtsNarrationRequestSynthesizeValidation(dto, extSystemId)

// Ext system change invalidates the scoped picks.
watch(extSystemId, () => {
  dto.value.voiceFamilySlug = null
  dto.value.assetLicence = null
  dto.value.podcasts = []
})

const onOpen = () => {
  dto.value = createDefault()
  extSystemId.value = currentExtSystemId.value > 0 ? currentExtSystemId.value : null
}

const onSynthesize = (): Promise<TtsSynthesizeResponse> => {
  const trimmedTitle = dto.value.title?.trim()
  return synthesize({ ...dto.value, title: trimmedTitle ? trimmedTitle : null })
}
</script>

<template>
  <ACreateDialog
    v-model="dialog"
    :v="v$"
    :call-create="onSynthesize"
    disable-redirect
    :button-class="buttonClass"
    :data-cy="dataCy"
    :max-width="700"
    @on-open="onOpen"
    @on-success="emit('onSuccess')"
    @on-close="dialog = false"
  >
    <template #button-title>
      {{ t('coreDam.ttsNarrationRequest.button.synthesize') }}
    </template>
    <template #title>
      {{ t('coreDam.ttsNarrationRequest.synthesize.title') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextarea
            v-model="dto.text"
            :label="t('coreDam.ttsNarrationRequest.synthesize.text')"
            :placeholder="t('coreDam.ttsNarrationRequest.synthesize.textPlaceholder')"
            :v="v$.dto.text"
            :rows="10"
            :suggested-length="TTS_SYNTHESIZE_TEXT_MAX"
            required
            data-cy="synthesize-text"
          />
        </ARow>
        <ARow>
          <DamExtSystemRemoteAutocomplete
            v-model="extSystemId"
            :client="damClient"
            :label="t('coreDam.ttsNarrationRequest.synthesize.extSystem')"
            :v="v$.extSystemId"
            required
            data-cy="synthesize-ext-system"
          />
        </ARow>
        <ARow>
          <VoiceFamilySelect
            v-model="dto.voiceFamilySlug"
            :ext-system-id="extSystemId"
            allow-null
            data-cy="synthesize-voice-family"
          />
        </ARow>
        <ARow>
          <DamAssetLicenceRemoteAutocomplete
            v-model="dto.assetLicence"
            :client="damClient"
            :ext-system-id="extSystemId"
            :label="t('coreDam.ttsNarrationRequest.synthesize.assetLicence')"
            :v="v$.dto.assetLicence"
            :disabled="extSystemId === null"
            required
            data-cy="synthesize-asset-licence"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="dto.title"
            :label="t('coreDam.ttsNarrationRequest.synthesize.assetTitle')"
            :placeholder="t('coreDam.ttsNarrationRequest.synthesize.assetTitlePlaceholder')"
            :v="v$.dto.title"
            data-cy="synthesize-asset-title"
          />
        </ARow>
        <ARow>
          <PodcastRemoteAutocomplete
            v-model="dto.podcasts"
            :ext-system-id="extSystemId"
            :label="t('coreDam.ttsNarrationRequest.synthesize.podcasts')"
            :disabled="extSystemId === null"
            multiple
            clearable
            data-cy="synthesize-podcasts"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
