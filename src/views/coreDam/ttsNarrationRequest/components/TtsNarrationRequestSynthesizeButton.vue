<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ADialogToolbar,
  AFormTextarea,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
  DamExtSystemRemoteAutocomplete,
  type IntegerIdNullable,
  useAlerts,
} from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsNarrationRequestApi'
import { fetchExtSystem } from '@/services/api/coreDam/extSystemApi'
import { useCachedAssetLicences } from '@/views/coreDam/assetLicence/composables/cachedAssetLicences'
import { useTtsNarrationRequestSynthesizeActions } from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestActions'
import {
  type TtsSynthesizeForm,
  useTtsNarrationRequestSynthesizeValidation,
} from '@/views/coreDam/ttsNarrationRequest/composables/ttsNarrationRequestValidation'
import VoiceFamilySelect from '@/views/coreDam/ttsNarrationRequest/components/VoiceFamilySelect.vue'

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
const { showValidationError, showErrorsDefault } = useAlerts()
const { currentExtSystemId } = useCurrentExtSystem()
const { synthesizeButtonLoading, synthesize } = useTtsNarrationRequestSynthesizeActions()

const dialog = ref(false)
const form = ref<TtsSynthesizeForm>({ text: '' })
const extSystemId = ref<IntegerIdNullable>(null)
const voiceFamilySlug = ref<string | null>(null)
const assetLicenceId = ref<IntegerIdNullable>(null)
const includeInRecommendedPodcast = ref(false)
const defaultAssetLicenceId = ref<IntegerIdNullable>(null)

const { v$ } = useTtsNarrationRequestSynthesizeValidation(form)
const { addToCachedAssetLicences, fetchCachedAssetLicences, getCachedAssetLicence } = useCachedAssetLicences()

// Rough heuristic: ~14 chars/sec average speech rate across Slavic languages.
const CHARS_PER_SECOND = 14
const TEXT_MAX_LENGTH = 50_000

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
  try {
    const ext = await fetchExtSystem(newId)
    defaultAssetLicenceId.value = ext.ttsDefaultAssetLicence
    if (ext.ttsDefaultAssetLicence !== null) {
      addToCachedAssetLicences([ext.ttsDefaultAssetLicence])
      await fetchCachedAssetLicences()
    }
  } catch (error) {
    showErrorsDefault(error)
  }
})

const open = () => {
  form.value = { text: '' }
  extSystemId.value = currentExtSystemId.value > 0 ? currentExtSystemId.value : null
  voiceFamilySlug.value = null
  assetLicenceId.value = null
  defaultAssetLicenceId.value = null
  includeInRecommendedPodcast.value = false
  v$.value.$reset()
  dialog.value = true
}

const close = () => {
  dialog.value = false
}

const onConfirm = async () => {
  v$.value.$touch()
  if (v$.value.$invalid || extSystemId.value === null) {
    showValidationError()
    return
  }
  const res = await synthesize({
    text: form.value.text,
    voiceFamilySlug: voiceFamilySlug.value,
    includeInRecommendedPodcast: includeInRecommendedPodcast.value,
    extSystem: extSystemId.value,
    assetLicence: assetLicenceId.value,
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
              <span>{{ textLength.toLocaleString() }} / {{ TEXT_MAX_LENGTH.toLocaleString() }}</span>
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
            <VSwitch
              v-model="includeInRecommendedPodcast"
              class="pl-2"
              :label="t('coreDam.ttsNarrationRequest.synthesize.includeInRecommendedPodcast')"
              hide-details
              data-cy="synthesize-include-recommended-podcast"
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
