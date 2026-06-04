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
  type TtsSynthesizeForm,
  useTtsNarrationRequestSynthesizeValidation,
} from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestValidation'
import VoiceFamilySelect from '@/views/coreDam/ttsNarrationRequest/components/VoiceFamilySelect.vue'
import type { TtsSynthesizeResponse } from '@/types/coreDam/TtsNarrationRequest'

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

const dialog = ref(false)
const form = ref<TtsSynthesizeForm>({ text: '', title: '', podcasts: [] })
const extSystemId = ref<IntegerIdNullable>(null)
const voiceFamilySlug = ref<string | null>(null)
const assetLicenceId = ref<IntegerIdNullable>(null)

const { v$ } = useTtsNarrationRequestSynthesizeValidation(form, extSystemId, assetLicenceId)

// Ext system only scopes the licence/voice pickers — reset both when it changes.
watch(extSystemId, () => {
  voiceFamilySlug.value = null
  assetLicenceId.value = null
})

const onOpen = () => {
  form.value = { text: '', title: '', podcasts: [] }
  extSystemId.value = currentExtSystemId.value > 0 ? currentExtSystemId.value : null
  voiceFamilySlug.value = null
  assetLicenceId.value = null
}

const onSynthesize = (): Promise<TtsSynthesizeResponse> => {
  // assetLicence is guaranteed by validation (required + minValue); narrow for the typed payload.
  if (assetLicenceId.value === null) throw new Error('Asset licence is required')
  const trimmedTitle = form.value.title.trim()
  return synthesize({
    text: form.value.text,
    title: trimmedTitle === '' ? null : trimmedTitle,
    voiceFamilySlug: voiceFamilySlug.value,
    podcasts: form.value.podcasts,
    assetLicence: assetLicenceId.value,
  })
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
            v-model="form.text"
            :label="t('coreDam.ttsNarrationRequest.synthesize.text')"
            :placeholder="t('coreDam.ttsNarrationRequest.synthesize.textPlaceholder')"
            :v="v$.form.text"
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
            v-model="voiceFamilySlug"
            :ext-system-id="extSystemId"
            allow-null
            data-cy="synthesize-voice-family"
          />
        </ARow>
        <ARow>
          <DamAssetLicenceRemoteAutocomplete
            v-model="assetLicenceId"
            :client="damClient"
            :ext-system-id="extSystemId"
            :label="t('coreDam.ttsNarrationRequest.synthesize.assetLicence')"
            :v="v$.assetLicenceId"
            :disabled="extSystemId === null"
            required
            data-cy="synthesize-asset-licence"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="form.title"
            :label="t('coreDam.ttsNarrationRequest.synthesize.assetTitle')"
            :placeholder="t('coreDam.ttsNarrationRequest.synthesize.assetTitlePlaceholder')"
            :v="v$.form.title"
            data-cy="synthesize-asset-title"
          />
        </ARow>
        <ARow>
          <PodcastRemoteAutocomplete
            v-model="form.podcasts"
            :label="t('coreDam.ttsNarrationRequest.synthesize.podcasts')"
            multiple
            clearable
            data-cy="synthesize-podcasts"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
