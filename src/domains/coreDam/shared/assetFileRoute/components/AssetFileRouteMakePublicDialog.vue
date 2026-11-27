<script setup lang="ts">
import {
  ADialogToolbar,
  AFormTextField,
  DamAssetType,
  stringToSlug,
  useAlerts,
  useValidate,
} from '@anzusystems/common-admin'
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { helpers } from '@vuelidate/validators'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { makePublicFile } from '@/domains/coreDam/asset/api/fileApi'
import { useWhileOnPage } from '@/domains/system/composables/whileOnPage'

const props = withDefaults(
  defineProps<{
    fileId: DocId
    assetType: DamAssetTypeType
    title: string
    /*
     * Called once the file is public. A callback, not an event: the dialog may be unmounted by then,
     * and Vue drops events emitted by unmounted components.
     */
    madePublic: () => void
  }>(),
  {}
)

const modelValue = defineModel<boolean>({ required: true })

const { t } = useI18n()

const buttonLoading = ref(false)
const slug = ref('')

const onCancel = () => {
  modelValue.value = false
}

const { showRecordWas, showValidationError, showErrorsDefault, showUnknownError } = useAlerts()
// Errors are shown on the page the change was made from, not on the next one.
const whileOnPage = useWhileOnPage()

const modelValueComputed = computed(() => modelValue.value)

const { required, minLength, maxLength } = useValidate()

/*
 * The slug made from the input is what is sent and checked by the server.
 * Three typed characters can yield a two-character slug, or none.
 * Validated as sent, by the server's rules (`AssetFileRouteAdmCreateDto`
 * in core-dam: 3 to 128 characters of this pattern).
 * The field keeps the typed text.
 */
const slugToSend = computed(() => stringToSlug(slug.value))
const slugFormat = helpers.withMessage(
  () => t('error.jsValidation.slug'),
  (value: string) => !helpers.req(value) || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
)

const rules = computed(() => {
  if (props.assetType === DamAssetType.Image) {
    return {
      slug: {},
    }
  }
  return {
    slug: {
      required,
      minLength: minLength(3),
      maxLength: maxLength(128),
      slugFormat,
    },
  }
})

const v$ = useVuelidate(rules, { slug: slugToSend })

watch(modelValueComputed, (newValue) => {
  if (!newValue) return
  // Reopened, the form shows no slug errors until it is confirmed.
  v$.value.$reset()
  if (props.assetType !== DamAssetType.Image) {
    slug.value = stringToSlug(props.title)
  }
})

const onConfirm = async () => {
  // One save at a time. The button only spins, and a key press on the still focused button clicks it again.
  if (buttonLoading.value) return
  buttonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    buttonLoading.value = false
    return
  }
  try {
    await makePublicFile(props.assetType, props.fileId, slugToSend.value)

    showRecordWas('updated')
  } catch (e) {
    whileOnPage(() => {
      if (!showErrorsDefault(e)) showUnknownError()
    })
    // The dialog stays open with the typed input for another try.
    return
  } finally {
    buttonLoading.value = false
  }
  // Only after a successful change. A failed change leaves nothing new to read.
  onCancel()
  props.madePublic()
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="modelValue = $event"
  >
    <VCard
      v-if="modelValue"
      width="500"
      class="mt-0 mr-auto ml-auto"
    >
      <ADialogToolbar @cancel="onCancel">
        {{ t('coreDam.asset.assetFilePublicLink.actions.makePublic') }}
      </ADialogToolbar>
      <VCardText>
        <AFormTextField
          v-if="assetType !== DamAssetType.Image"
          v-model="slug"
          :label="t('coreDam.asset.assetFilePublicLink.model.slug')"
          :v="v$.slug"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="onCancel"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          :loading="buttonLoading"
          data-cy="button-confirm"
          @click.stop="onConfirm"
        >
          {{ t('common.button.confirm') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
