<script lang="ts" setup>
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { AFormTextField, AFormValueObjectOptionsSelect, ARow } from '@anzusystems/common-admin'
import type { GoogleSsmlGenderType, GoogleTtsVoice } from '@/types/coreDam/Voice'
import { useGoogleSsmlGender } from '@/model/coreDam/valueObject/GoogleSsmlGender'
import { useVoiceGoogleTtsValidation } from '@/views/coreDam/voiceFamily/composables/voiceValidation'

const props = withDefaults(
  defineProps<{
    voice: GoogleTtsVoice
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

const emit = defineEmits<{
  (e: 'update:voice', value: GoogleTtsVoice): void
}>()

const { t } = useI18n()
const { valueObjectOptions: ssmlGenderOptions } = useGoogleSsmlGender()

const localVoice = toRef(props, 'voice')
const { v$ } = useVoiceGoogleTtsValidation(localVoice)

const updateString = (key: 'externalVoiceId', value: string | number | null | undefined) => {
  emit('update:voice', { ...props.voice, [key]: String(value ?? '') })
}

const updateNumber = (key: 'speakingRate' | 'pitch', value: string | number | null | undefined) => {
  emit('update:voice', { ...props.voice, [key]: Number(value ?? 0) })
}

const updateSsmlGender = (value: GoogleSsmlGenderType) => {
  emit('update:voice', { ...props.voice, ssmlGender: value })
}

const updateBoolean = (key: 'main' | 'active', value: unknown) => {
  emit('update:voice', { ...props.voice, [key]: Boolean(value) })
}
</script>

<template>
  <div>
    <ARow>
      <AFormTextField
        :model-value="voice.externalVoiceId"
        :label="t('coreDam.voice.model.externalVoiceId')"
        :v="v$.voice.externalVoiceId"
        :readonly="readonly"
        required
        data-cy="voice-external-voice-id"
        @update:model-value="updateString('externalVoiceId', $event)"
      />
    </ARow>
    <ARow>
      <AFormValueObjectOptionsSelect
        :model-value="voice.ssmlGender"
        :label="t('coreDam.voice.model.ssmlGender')"
        :items="ssmlGenderOptions"
        :readonly="readonly"
        data-cy="voice-ssml-gender"
        @update:model-value="updateSsmlGender($event as GoogleSsmlGenderType)"
      />
    </ARow>
    <ARow>
      <AFormTextField
        :model-value="voice.speakingRate"
        :label="t('coreDam.voice.model.speakingRate')"
        type="number"
        :min="0.25"
        :max="4.0"
        :step="0.05"
        :readonly="readonly"
        :v="v$.voice.speakingRate"
        data-cy="voice-speaking-rate"
        @update:model-value="updateNumber('speakingRate', $event)"
      />
    </ARow>
    <ARow>
      <AFormTextField
        :model-value="voice.pitch"
        :label="t('coreDam.voice.model.pitch')"
        type="number"
        :min="-20"
        :max="20"
        :step="0.5"
        :readonly="readonly"
        :v="v$.voice.pitch"
        data-cy="voice-pitch"
        @update:model-value="updateNumber('pitch', $event)"
      />
    </ARow>
    <ARow>
      <VSwitch
        :model-value="voice.main"
        class="pl-2"
        :label="t('coreDam.voice.model.main')"
        :readonly="readonly"
        hide-details
        data-cy="voice-main"
        @update:model-value="updateBoolean('main', $event)"
      />
    </ARow>
    <ARow>
      <VSwitch
        :model-value="voice.active"
        class="pl-2"
        :label="t('coreDam.voice.model.active')"
        :readonly="readonly"
        hide-details
        data-cy="voice-active"
        @update:model-value="updateBoolean('active', $event)"
      />
    </ARow>
  </div>
</template>
