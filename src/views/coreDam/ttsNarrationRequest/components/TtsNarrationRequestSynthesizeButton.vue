<script lang="ts" setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ADialogToolbar,
  AFormTextarea,
  ARow,
  ASystemEntityScope,
  DamAssetLicenceRemoteAutocomplete,
  DamExtSystemRemoteAutocomplete,
  useAlerts,
} from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/ttsNarrationRequestApi'
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
const { showValidationError } = useAlerts()
const { currentExtSystemId } = useCurrentExtSystem()
const { synthesizeButtonLoading, synthesize } = useTtsNarrationRequestSynthesizeActions()

const dialog = ref(false)
const form = ref<TtsSynthesizeForm>({ text: '' })
const extSystemId = ref<number | null>(null)
const voiceFamilySlug = ref<string | null>(null)
const assetLicenceId = ref<number | null>(null)
const includeInRecommendedPodcast = ref(false)

const { v$ } = useTtsNarrationRequestSynthesizeValidation(form)

watch(extSystemId, () => {
  voiceFamilySlug.value = null
  assetLicenceId.value = null
})

const open = () => {
  form.value = { text: '' }
  extSystemId.value = currentExtSystemId.value > 0 ? currentExtSystemId.value : null
  voiceFamilySlug.value = null
  assetLicenceId.value = null
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
