<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ADialogToolbar, ARow, useAlerts } from '@anzusystems/common-admin'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import { useTtsAudioSynthesizeActions } from '@/views/coreDam/ttsAudio/composables/ttsAudioActions'
import {
  TTS_SYNTHESIZE_TEXT_MAX,
  TTS_SYNTHESIZE_TEXT_MIN,
  type TtsSynthesizeForm,
  useTtsAudioSynthesizeValidation,
} from '@/views/coreDam/ttsAudio/composables/ttsAudioValidation'
import VoiceFamilySelect from '@/views/coreDam/ttsAudio/components/VoiceFamilySelect.vue'

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
  (e: 'onSuccess'): void
}>()

const { t } = useI18n()
const { showValidationError } = useAlerts()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { synthesizeButtonLoading, synthesize } = useTtsAudioSynthesizeActions()

const dialog = ref(false)
const form = ref<TtsSynthesizeForm>({ text: '' })
const voiceFamilySlug = ref<string | null>(null)
const includeInRecommendedPodcast = ref(false)

const { v$ } = useTtsAudioSynthesizeValidation(form)

const charCount = computed(() => form.value.text.length)

const open = () => {
  form.value = { text: '' }
  voiceFamilySlug.value = null
  includeInRecommendedPodcast.value = false
  v$.value.$reset()
  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const onConfirm = async () => {
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    return
  }
  const res = await synthesize({
    text: form.value.text,
    voiceFamilySlug: voiceFamilySlug.value,
    includeInRecommendedPodcast: includeInRecommendedPodcast.value,
    assetLicence: currentAssetLicenceId.value,
  })
  if (res !== null) {
    emit('onSuccess')
    close()
  }
}
</script>

<template>
  <ABtnPrimary
    :class="buttonClass"
    :data-cy="dataCy"
    rounded="pill"
    @click.stop="open"
  >
    {{ t('coreDam.ttsAudio.button.synthesize') }}
  </ABtnPrimary>

  <VDialog
    v-model="dialog"
    :width="700"
    scrollable
  >
    <VCard v-if="dialog">
      <ADialogToolbar @on-cancel="close">
        {{ t('coreDam.ttsAudio.synthesize.title') }}
      </ADialogToolbar>
      <VCardText>
        <ARow>
          <VTextarea
            v-model="form.text"
            :label="t('coreDam.ttsAudio.synthesize.text')"
            :placeholder="t('coreDam.ttsAudio.synthesize.textPlaceholder')"
            :error-messages="v$.form.text.$errors.map((e) => e.$message as string)"
            :counter="TTS_SYNTHESIZE_TEXT_MAX"
            :hint="`${charCount} / ${TTS_SYNTHESIZE_TEXT_MAX}  (min ${TTS_SYNTHESIZE_TEXT_MIN})`"
            persistent-hint
            rows="10"
            variant="outlined"
            density="compact"
            data-cy="synthesize-text"
            @blur="v$.form.text.$touch()"
          />
        </ARow>
        <ARow>
          <VoiceFamilySelect
            v-model="voiceFamilySlug"
            allow-null
            data-cy="synthesize-voice-family"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="includeInRecommendedPodcast"
            class="pl-2"
            :label="t('coreDam.ttsAudio.synthesize.includeInRecommendedPodcast')"
            hide-details
            data-cy="synthesize-include-recommended-podcast"
          />
        </ARow>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="close"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="synthesizeButtonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('coreDam.ttsAudio.button.synthesize') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
