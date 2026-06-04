<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'
import { ACreateDialog } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { useVoiceKindFactory } from '@/model/coreDam/factory/VoiceFactory'
import type { Voice } from '@/types/coreDam/Voice'
import { VoiceDiscriminator } from '@/types/coreDam/Voice'
import { useVoiceCreateActions } from '@/views/coreDam/voiceFamily/composables/voiceActions'
import VoiceManage from '@/views/coreDam/voiceFamily/components/VoiceManage.vue'

const props = withDefaults(
  defineProps<{
    voiceFamilyId: DocId
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)

const emit = defineEmits<{
  (e: 'onSuccess', data: Voice): void
}>()

const { t } = useI18n()
const { createVoiceKind } = useVoiceKindFactory()
const { createVoice } = useVoiceCreateActions()
const v$ = useVuelidate()

// Seeded with an empty family; @on-open sets the real voiceFamilyId before the form is shown.
const voice = ref<Voice>(createVoiceKind(VoiceDiscriminator.Elevenlabs, ''))
const dialog = ref(false)

const onOpen = () => {
  voice.value = createVoiceKind(VoiceDiscriminator.Elevenlabs, props.voiceFamilyId)
}

const create = (): Promise<Voice> => createVoice(voice.value)
</script>

<template>
  <ACreateDialog
    v-model="dialog"
    :v="v$"
    :call-create="create"
    disable-redirect
    :button-class="buttonClass"
    :data-cy="dataCy"
    :max-width="600"
    @on-open="onOpen"
    @on-success="emit('onSuccess', $event)"
    @on-close="dialog = false"
  >
    <template #title>
      {{ t('coreDam.voice.meta.create') }}
    </template>
    <template #content>
      <VoiceManage v-model:voice="voice" />
    </template>
  </ACreateDialog>
</template>
