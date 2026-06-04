<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AFormValueObjectOptionsSelect, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/voiceApi'
import {
  VoiceDiscriminator,
  type ElevenlabsVoice,
  type GoogleTtsVoice,
  type Voice,
  type VoiceDiscriminatorType,
} from '@/types/coreDam/Voice'
import { useVoiceDiscriminator } from '@/model/coreDam/valueObject/VoiceDiscriminator'
import { useVoiceKindFactory } from '@/model/coreDam/factory/VoiceFactory'
import VoiceFormElevenlabs from '@/views/coreDam/voiceFamily/components/forms/VoiceFormElevenlabs.vue'
import VoiceFormGoogleTts from '@/views/coreDam/voiceFamily/components/forms/VoiceFormGoogleTts.vue'

withDefaults(
  defineProps<{
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

const voice = defineModel<Voice>('voice', { required: true })

const { t } = useI18n()
const { valueObjectOptions: discriminatorOptions } = useVoiceDiscriminator()
const { createVoiceKind } = useVoiceKindFactory()

const isEdit = computed(() => voice.value.id !== '')

// Provider toggle: switching kind replaces the voice with a fresh one of that kind (create only).
const discriminator = computed<VoiceDiscriminatorType>({
  get: () => voice.value.discriminator,
  set: (newKind) => {
    if (isEdit.value || newKind === voice.value.discriminator) return
    voice.value = createVoiceKind(newKind, voice.value.voiceFamily)
  },
})

// Cast the discriminated union to the concrete kind for each provider form's v-model.
const elevenlabsVoice = computed<ElevenlabsVoice>({
  get: () => voice.value as ElevenlabsVoice,
  set: (value) => {
    voice.value = value
  },
})
const googleTtsVoice = computed<GoogleTtsVoice>({
  get: () => voice.value as GoogleTtsVoice,
  set: (value) => {
    voice.value = value
  },
})
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <ARow>
      <AFormValueObjectOptionsSelect
        v-model="discriminator"
        :items="discriminatorOptions"
        :label="t('coreDam.voice.model.discriminator')"
        :disabled="readonly || isEdit"
        data-cy="voice-discriminator"
      />
    </ARow>
    <VoiceFormElevenlabs
      v-if="voice.discriminator === VoiceDiscriminator.Elevenlabs"
      v-model="elevenlabsVoice"
      :readonly="readonly"
    />
    <VoiceFormGoogleTts
      v-else-if="voice.discriminator === VoiceDiscriminator.GoogleTts"
      v-model="googleTtsVoice"
      :readonly="readonly"
    />
  </ASystemEntityScope>
</template>
