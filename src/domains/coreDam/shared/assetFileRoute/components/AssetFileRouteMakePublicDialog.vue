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
    /* Called once the file was made public. A function, not an event: the answer can find the dialog unmounted
     * with what drew it, and what an unmounted component emits Vue drops. */
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
// Said on the page the change was asked from, as the failure of the read after it: not on the next one.
const whileOnPage = useWhileOnPage()

const modelValueComputed = computed(() => modelValue.value)

const { required, minLength, maxLength } = useValidate()

/* What is sent is the slug made of what was typed, and that is what the server checks: three characters typed can
 * make a slug of two, and letters it has no use for make none at all. Checked as it will be sent, by the rules of
 * the server (`AssetFileRouteAdmCreateDto` of core-dam: 3 to 128 characters of this pattern); the field keeps what
 * was typed. */
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
  // Opened anew, the form is one nobody has confirmed yet: it says nothing of its slug until it is confirmed.
  v$.value.$reset()
  if (props.assetType !== DamAssetType.Image) {
    slug.value = stringToSlug(props.title)
  }
})

const onConfirm = async () => {
  // One at a time: the button only spins meanwhile, and a key pressed on it, still in focus, is a click again.
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
    // The dialog stays, with what was typed into it, for another try.
    return
  } finally {
    buttonLoading.value = false
  }
  // Only once it went through: after a change that failed there is nothing new to read.
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
