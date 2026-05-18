<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ACreateDialog, AFormTextField, AFormValueObjectOptionsSelect, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/voiceApi'
import { createVoice } from '@/services/api/coreDam/voiceApi'
import { useVoiceFactory } from '@/model/coreDam/factory/VoiceFactory'
import type { Voice } from '@/types/coreDam/Voice'
import { useTtsProvider } from '@/model/coreDam/valueObject/TtsProvider'

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
const dialog = ref(false)
const { createDefault } = useVoiceFactory()
const { ttsProviderOptions } = useTtsProvider()

const voice = ref<Voice>(createDefault())
const metadataRaw = ref('')
const metadataError = ref<string | null>(null)

const parsedMetadata = computed<Record<string, unknown> | null>(() => {
  if (!metadataRaw.value.trim()) return {}
  try {
    const parsed = JSON.parse(metadataRaw.value)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
})

const onOpen = () => {
  voice.value = createDefault(props.voiceFamilyId)
  metadataRaw.value = ''
  metadataError.value = null
}

const onMetadataBlur = () => {
  metadataError.value = parsedMetadata.value === null ? t('coreDam.voice.validation.metadataInvalid') : null
}

const create = async () => {
  if (parsedMetadata.value === null) {
    metadataError.value = t('coreDam.voice.validation.metadataInvalid')
    throw new Error(metadataError.value)
  }
  return await createVoice({
    voiceFamilyId: voice.value.voiceFamilyId,
    provider: voice.value.provider,
    externalVoiceId: voice.value.externalVoiceId,
    metadata: parsedMetadata.value,
    primary: voice.value.primary,
    active: voice.value.active,
  })
}
</script>

<template>
  <ACreateDialog
    v-model="dialog"
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
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="voice.provider"
            :label="t('coreDam.voice.model.provider')"
            :items="ttsProviderOptions"
            data-cy="voice-provider"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="voice.externalVoiceId"
            :label="t('coreDam.voice.model.externalVoiceId')"
            data-cy="voice-external-id"
          />
        </ARow>
        <ARow>
          <VTextarea
            v-model="metadataRaw"
            :label="t('coreDam.voice.model.metadata')"
            :error-messages="metadataError ? [metadataError] : []"
            rows="4"
            data-cy="voice-metadata"
            @blur="onMetadataBlur"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="voice.primary"
            class="pl-2"
            :label="t('coreDam.voice.model.primary')"
            data-cy="voice-is-primary"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="voice.active"
            class="pl-2"
            :label="t('coreDam.voice.model.active')"
            data-cy="voice-is-active"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
