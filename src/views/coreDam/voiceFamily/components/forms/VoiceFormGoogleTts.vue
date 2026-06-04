<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { AFormTextField, AFormValueObjectOptionsSelect, ARow } from '@anzusystems/common-admin'
import type { GoogleTtsVoice } from '@/types/coreDam/Voice'
import { useGoogleSsmlGender } from '@/model/coreDam/valueObject/GoogleSsmlGender'
import { useVoiceGoogleTtsValidation } from '@/views/coreDam/voiceFamily/composables/voiceValidation'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

const voice = defineModel<GoogleTtsVoice>({ required: true })

const { t } = useI18n()
const { valueObjectOptions: ssmlGenderOptions } = useGoogleSsmlGender()
const { v$ } = useVoiceGoogleTtsValidation(voice)
</script>

<template>
  <div>
    <ARow>
      <AFormTextField
        v-model="voice.externalVoiceId"
        :label="t('coreDam.voice.model.externalVoiceId')"
        :v="v$.voice.externalVoiceId"
        :readonly="readonly"
        required
        data-cy="voice-external-voice-id"
      />
    </ARow>
    <ARow>
      <AFormValueObjectOptionsSelect
        v-model="voice.ssmlGender"
        :label="t('coreDam.voice.model.ssmlGender')"
        :items="ssmlGenderOptions"
        :v="v$.voice.ssmlGender"
        :readonly="readonly"
        data-cy="voice-ssml-gender"
      />
    </ARow>
    <ARow>
      <AFormTextField
        v-model.number="voice.speakingRate"
        :label="t('coreDam.voice.model.speakingRate')"
        type="number"
        :min="0.25"
        :max="4.0"
        :step="0.05"
        :readonly="readonly"
        :v="v$.voice.speakingRate"
        data-cy="voice-speaking-rate"
      />
    </ARow>
    <ARow>
      <AFormTextField
        v-model.number="voice.pitch"
        :label="t('coreDam.voice.model.pitch')"
        type="number"
        :min="-20"
        :max="20"
        :step="0.5"
        :readonly="readonly"
        :v="v$.voice.pitch"
        data-cy="voice-pitch"
      />
    </ARow>
    <ARow>
      <VSwitch
        v-model="voice.main"
        class="pl-2"
        :label="t('coreDam.voice.model.main')"
        :readonly="readonly"
        hide-details
        data-cy="voice-main"
      />
    </ARow>
    <ARow>
      <VSwitch
        v-model="voice.active"
        class="pl-2"
        :label="t('coreDam.voice.model.active')"
        :readonly="readonly"
        hide-details
        data-cy="voice-active"
      />
    </ARow>
  </div>
</template>
