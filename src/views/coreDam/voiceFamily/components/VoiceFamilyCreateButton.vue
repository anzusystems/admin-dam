<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ACreateDialog,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createVoiceFamily, ENTITY } from '@/services/api/coreDam/voiceFamilyApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useVoiceFamilyFactory } from '@/model/coreDam/factory/VoiceFamilyFactory'
import type { VoiceFamily, VoiceFamilyCreate } from '@/types/coreDam/VoiceFamily'
import { useVoiceFamilyValidation } from '@/views/coreDam/voiceFamily/composables/voiceFamilyValidation'
import { useVoiceDiscriminator } from '@/model/coreDam/valueObject/VoiceDiscriminator'

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
  (e: 'onSuccess', data: VoiceFamily): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = useVoiceFamilyFactory()
const voiceFamily = ref<VoiceFamily>(createDefault(currentExtSystemId.value))
const dialog = ref(false)

const { v$ } = useVoiceFamilyValidation(voiceFamily)
const { t } = useI18n()
const { valueObjectOptionsNullable: ttsProviderOptionsNullable } = useVoiceDiscriminator()

const onOpen = () => {
  voiceFamily.value = createDefault(currentExtSystemId.value)
}

const create = async () => {
  const payload: VoiceFamilyCreate = {
    extSystem: voiceFamily.value.extSystem,
    slug: voiceFamily.value.slug,
    displayName: voiceFamily.value.displayName,
    language: voiceFamily.value.language,
    preferredProvider: voiceFamily.value.preferredProvider,
    active: voiceFamily.value.active,
    keywords: voiceFamily.value.keywords,
  }
  return await createVoiceFamily(payload)
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
    :max-width="500"
    @on-open="onOpen"
    @on-success="emit('onSuccess', $event)"
    @on-close="dialog = false"
  >
    <template #title>
      {{ t('coreDam.voiceFamily.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="voiceFamily.slug"
            :label="t('coreDam.voiceFamily.model.slug')"
            :v="v$.voiceFamily.slug"
            required
            data-cy="voice-family-slug"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="voiceFamily.displayName"
            :label="t('coreDam.voiceFamily.model.displayName')"
            :v="v$.voiceFamily.displayName"
            required
            data-cy="voice-family-display-name"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="voiceFamily.language"
            :label="t('coreDam.voiceFamily.model.language')"
            :v="v$.voiceFamily.language"
            required
            data-cy="voice-family-language"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="voiceFamily.preferredProvider"
            :label="t('coreDam.voiceFamily.model.preferredProvider')"
            :items="ttsProviderOptionsNullable"
            data-cy="voice-family-preferred-provider"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="voiceFamily.active"
            class="pl-2"
            :label="t('coreDam.voiceFamily.model.active')"
            hide-details
            data-cy="voice-family-is-active"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
