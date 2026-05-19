<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow } from '@anzusystems/common-admin'
import type { ElevenlabsVoice } from '@/types/coreDam/Voice'
import { useVoiceElevenlabsValidation } from '@/views/coreDam/voiceFamily/composables/voiceValidation'

const props = withDefaults(
  defineProps<{
    voice: ElevenlabsVoice
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

const emit = defineEmits<{
  (e: 'update:voice', value: ElevenlabsVoice): void
}>()

const { t } = useI18n()

const localVoice = computed(() => props.voice)
const { v$ } = useVoiceElevenlabsValidation(localVoice)

const updateString = (key: 'externalVoiceId' | 'modelId', value: string | number | null | undefined) => {
  emit('update:voice', { ...props.voice, [key]: value ?? '' })
}

const updateNumber = (
  key: 'stability' | 'similarityBoost',
  value: string | number | null | undefined,
) => {
  emit('update:voice', { ...props.voice, [key]: Number(value ?? 0) })
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
      <AFormTextField
        :model-value="voice.modelId"
        :label="t('coreDam.voice.model.modelId')"
        :v="v$.voice.modelId"
        :readonly="readonly"
        required
        data-cy="voice-model-id"
        @update:model-value="updateString('modelId', $event)"
      />
    </ARow>
    <ARow>
      <VTextField
        :model-value="voice.stability"
        :label="t('coreDam.voice.model.stability')"
        type="number"
        :min="0"
        :max="1"
        :step="0.05"
        :readonly="readonly"
        data-cy="voice-stability"
        @update:model-value="updateNumber('stability', $event)"
      />
    </ARow>
    <ARow>
      <VTextField
        :model-value="voice.similarityBoost"
        :label="t('coreDam.voice.model.similarityBoost')"
        type="number"
        :min="0"
        :max="1"
        :step="0.05"
        :readonly="readonly"
        data-cy="voice-similarity-boost"
        @update:model-value="updateNumber('similarityBoost', $event)"
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
