<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ADialogToolbar,
  AFormTextarea,
  AFormTextField,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
  DamExtSystemRemoteAutocomplete,
  type IntegerIdNullable,
  useAlerts,
} from '@anzusystems/common-admin'
import PodcastRemoteAutocomplete from '@/views/coreDam/podcast/components/PodcastRemoteAutocomplete.vue'
import { damClient } from '@/services/api/clients/damClient'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsNarrationRequestApi'
import { fetchExtSystem } from '@/services/api/coreDam/extSystemApi'
import { useCachedAssetLicences } from '@/views/coreDam/assetLicence/composables/cachedAssetLicences'
import { useTtsNarrationRequestSynthesizeActions } from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import {
  TTS_SYNTHESIZE_TEXT_MAX,
  type TtsSynthesizeForm,
  useTtsNarrationRequestSynthesizeValidation,
} from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestValidation'
import VoiceFamilySelect from '@/views/coreDam/ttsNarrationRequest/components/VoiceFamilySelect.vue'
import type { TtsNarrationRequest } from '@/types/coreDam/TtsNarrationRequest'

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
  (e: 'onSuccess', request: TtsNarrationRequest): void
}>()

const { t } = useI18n()
const { showValidationError, showErrorsDefault } = useAlerts()
const { currentExtSystemId } = useCurrentExtSystem()
const { synthesizeButtonLoading, synthesize } = useTtsNarrationRequestSynthesizeActions()

const dialog = ref(false)
const form = ref<TtsSynthesizeForm>({ text: '', title: '', podcasts: [] })
const extSystemId = ref<IntegerIdNullable>(null)
const voiceFamilySlug = ref<string | null>(null)
const assetLicenceId = ref<IntegerIdNullable>(null)
const defaultAssetLicenceId = ref<IntegerIdNullable>(null)
let extSystemSeq = 0

const { v$ } = useTtsNarrationRequestSynthesizeValidation(form, extSystemId)
const { addToCachedAssetLicences, fetchCachedAssetLicences, getCachedAssetLicence } = useCachedAssetLicences()

// Rough heuristic: ~14 chars/sec average speech rate across Slavic languages.
const CHARS_PER_SECOND = 14

const textLength = computed(() => form.value.text.length)
const estimatedSeconds = computed(() => Math.ceil(textLength.value / CHARS_PER_SECOND))
const estimatedDurationLabel = computed(() => {
  if (textLength.value === 0) return ''
  const min = Math.floor(estimatedSeconds.value / 60)
  const sec = estimatedSeconds.value % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
})

const assetLicencePlaceholder = computed(() => {
  if (defaultAssetLicenceId.value === null) return undefined
  const cached = getCachedAssetLicence(defaultAssetLicenceId.value)
  return cached?.name
    ? t('coreDam.ttsNarrationRequest.synthesize.assetLicenceDefaultPlaceholder', { name: cached.name })
    : undefined
})

watch(extSystemId, async (newId) => {
  voiceFamilySlug.value = null
  assetLicenceId.value = null
  defaultAssetLicenceId.value = null
  if (newId === null) return
  const seq = ++extSystemSeq
  try {
    const ext = await fetchExtSystem(newId)
    if (seq !== extSystemSeq) return
    defaultAssetLicenceId.value = ext.ttsDefaultAssetLicence
    if (ext.ttsDefaultAssetLicence !== null) {
      addToCachedAssetLicences([ext.ttsDefaultAssetLicence])
      await fetchCachedAssetLicences()
    }
  } catch (error) {
    if (seq !== extSystemSeq) return
    showErrorsDefault(error)
  }
})

const open = () => {
  form.value = { text: '', title: '', podcasts: [] }
  extSystemId.value = currentExtSystemId.value > 0 ? currentExtSystemId.value : null
  voiceFamilySlug.value = null
  assetLicenceId.value = null
  defaultAssetLicenceId.value = null
  v$.value.$reset()
  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const onConfirm = async () => {
  v$.value.$touch()
  // $invalid already covers a missing ext system (required + minValue); the explicit null check
  // additionally narrows extSystemId from IntegerIdNullable to IntegerId for the typed payload below.
  if (v$.value.$invalid || extSystemId.value === null) {
    showValidationError()
    return
  }
  const trimmedTitle = form.value.title.trim()
  const res = await synthesize({
    text: form.value.text,
    title: trimmedTitle === '' ? null : trimmedTitle,
    voiceFamilySlug: voiceFamilySlug.value,
    podcasts: form.value.podcasts,
    extSystem: extSystemId.value,
    assetLicence: assetLicenceId.value,
  })
  if (res !== null) {
    emit('onSuccess', res)
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
    {{ t('coreDam.ttsNarrationRequest.button.synthesize') }}
  </ABtnPrimary>

  <VDialog
    v-model="dialog"
    :width="700"
    scrollable
  >
    <VCard v-if="dialog">
      <ADialogToolbar @on-cancel="close">
        {{ t('coreDam.ttsNarrationRequest.synthesize.title') }}
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <AFormTextarea
              v-model="form.text"
              :label="t('coreDam.ttsNarrationRequest.synthesize.text')"
              :placeholder="t('coreDam.ttsNarrationRequest.synthesize.textPlaceholder')"
              :v="v$.form.text"
              :rows="10"
              required
              data-cy="synthesize-text"
            />
            <div class="text-caption text-medium-emphasis d-flex justify-end mt-n4 mb-2 px-2">
              <span>{{ textLength.toLocaleString() }} / {{ TTS_SYNTHESIZE_TEXT_MAX.toLocaleString() }}</span>
              <span
                v-if="estimatedDurationLabel"
                class="ml-3"
              >
                ≈ {{ estimatedDurationLabel }} {{ t('coreDam.ttsNarrationRequest.synthesize.estimatedDurationUnit') }}
              </span>
            </div>
          </ARow>
          <ARow>
            <DamExtSystemRemoteAutocomplete
              v-model="extSystemId"
              :client="damClient"
              :label="t('coreDam.ttsNarrationRequest.synthesize.extSystem')"
              :v="v$.extSystemId"
              required
              data-cy="synthesize-ext-system"
            />
          </ARow>
          <ARow>
            <VoiceFamilySelect
              v-model="voiceFamilySlug"
              :ext-system-id="extSystemId"
              allow-null
              data-cy="synthesize-voice-family"
            />
          </ARow>
          <ARow>
            <DamAssetLicenceRemoteAutocomplete
              v-model="assetLicenceId"
              :client="damClient"
              :ext-system-id="extSystemId"
              :label="t('coreDam.ttsNarrationRequest.synthesize.assetLicence')"
              :placeholder="assetLicencePlaceholder"
              :disabled="extSystemId === null"
              clearable
              data-cy="synthesize-asset-licence"
            />
          </ARow>
          <ARow>
            <AFormTextField
              v-model="form.title"
              :label="t('coreDam.ttsNarrationRequest.synthesize.assetTitle')"
              :placeholder="t('coreDam.ttsNarrationRequest.synthesize.assetTitlePlaceholder')"
              :v="v$.form.title"
              data-cy="synthesize-asset-title"
            />
          </ARow>
          <ARow>
            <PodcastRemoteAutocomplete
              v-model="form.podcasts"
              :label="t('coreDam.ttsNarrationRequest.synthesize.podcasts')"
              multiple
              clearable
              data-cy="synthesize-podcasts"
            />
          </ARow>
        </ASystemEntityScope>
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
          {{ t('coreDam.ttsNarrationRequest.button.synthesize') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
