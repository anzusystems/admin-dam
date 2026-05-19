<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
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

const props = withDefaults(
  defineProps<{
    voice: Voice
    readonly?: boolean
  }>(),
  {
    readonly: false,
  }
)

const emit = defineEmits<{
  (e: 'update:voice', value: Voice): void
}>()

const { t } = useI18n()
const { valueObjectOptions: discriminatorOptions } = useVoiceDiscriminator()
const { createVoiceKind } = useVoiceKindFactory()

const isEdit = computed(() => props.voice.id !== '')
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const discriminator = ref<VoiceDiscriminatorType>(props.voice.discriminator)

watch(
  () => props.voice.discriminator,
  (newVal) => {
    discriminator.value = newVal
  },
)

watch(discriminator, (newKind, oldKind) => {
  if (newKind === oldKind) return
  if (isEdit.value) return
  emit('update:voice', createVoiceKind(newKind, props.voice.voiceFamily))
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
    <template v-if="voice.discriminator === VoiceDiscriminator.Elevenlabs">
      <VoiceFormElevenlabs
        :voice="(voice as ElevenlabsVoice)"
        :readonly="readonly"
        @update:voice="emit('update:voice', $event)"
      />
    </template>
    <template v-else-if="voice.discriminator === VoiceDiscriminator.GoogleTts">
      <VoiceFormGoogleTts
        :voice="(voice as GoogleTtsVoice)"
        :readonly="readonly"
        @update:voice="emit('update:voice', $event)"
      />
    </template>
  </ASystemEntityScope>
</template>
