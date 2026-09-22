<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow } from '@anzusystems/common-admin'
import type { ElevenlabsVoice } from '@/domains/coreDam/voiceFamily/types/Voice'
import { useVoiceElevenlabsValidation } from '@/domains/coreDam/voiceFamily/composables/voiceValidation'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

const voice = defineModel<ElevenlabsVoice>({ required: true })

const { t } = useI18n()
const { v$ } = useVoiceElevenlabsValidation(voice)
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
      <AFormTextField
        v-model="voice.modelId"
        :label="t('coreDam.voice.model.modelId')"
        :v="v$.voice.modelId"
        :readonly="readonly"
        required
        data-cy="voice-model-id"
      />
    </ARow>
    <ARow>
      <AFormTextField
        v-model.number="voice.stability"
        :label="t('coreDam.voice.model.stability')"
        type="number"
        :min="0"
        :max="1"
        :step="0.05"
        :readonly="readonly"
        :v="v$.voice.stability"
        data-cy="voice-stability"
      />
    </ARow>
    <ARow>
      <AFormTextField
        v-model.number="voice.similarityBoost"
        :label="t('coreDam.voice.model.similarityBoost')"
        type="number"
        :min="0"
        :max="1"
        :step="0.05"
        :readonly="readonly"
        :v="v$.voice.similarityBoost"
        data-cy="voice-similarity-boost"
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
