<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'
import { ACreateDialog } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { createVoice } from '@/services/api/coreDam/voiceApi'
import { useVoiceKindFactory } from '@/model/coreDam/factory/VoiceFactory'
import type { Voice } from '@/types/coreDam/Voice'
import { VoiceDiscriminator } from '@/types/coreDam/Voice'
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
const v$ = useVuelidate()

const voice = ref<Voice | null>(null)
const dialog = ref(false)

const onOpen = () => {
  voice.value = createVoiceKind(VoiceDiscriminator.Elevenlabs, props.voiceFamilyId)
}

const create = async () => {
  if (!voice.value) throw new Error('Voice is not initialized')
  return await createVoice(voice.value)
}
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
      <VoiceManage
        v-if="voice"
        :voice="voice"
        @update:voice="voice = $event"
      />
    </template>
  </ACreateDialog>
</template>
