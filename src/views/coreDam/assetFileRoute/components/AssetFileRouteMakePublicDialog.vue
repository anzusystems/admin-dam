<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ADialogToolbar,
  AFormTextField,
  type DamAssetType,
  DamAssetType as DamAssetTypeValue,
  type DocId,
  stringToSlug,
  useAlerts,
  useValidate
} from '@anzusystems/common-admin'
import { makePublicFile } from '@/services/api/coreDam/fileApi'
import useVuelidate from '@vuelidate/core'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    fileId: DocId
    assetType: DamAssetType
    title: string
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean): void
  (e: 'afterUpdate'): void
}>()

const { t } = useI18n()

const buttonLoading = ref(false)
const slug = ref('')

const onCancel = () => {
  emit('update:modelValue', false)
}

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const modelValueComputed = computed(() => {
  return props.modelValue
})

watch(modelValueComputed, async (newValue) => {
  if (newValue) {
    slug.value = stringToSlug(props.title)
  }
})

const { required, minLength, maxLength } = useValidate()

const rules = computed(() => {
  return {
    slug: {
      required,
      minLength: minLength(3),
      maxLength: maxLength(128),
    },
  }
})

const v$ = useVuelidate(rules, { slug })

const onConfirm = async () => {
  buttonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    buttonLoading.value = false
    return
  }
  try {
    await makePublicFile(props.assetType, props.fileId, stringToSlug(slug.value))

    showRecordWas('updated')
  } catch (e) {
    showErrorsDefault(e)
  } finally {
    buttonLoading.value = false
    onCancel()
    emit('afterUpdate')
  }
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard
      v-if="modelValue"
      width="500"
      class="mt-0 mr-auto ml-auto"
    >
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('coreDam.asset.assetFilePublicLink.actions.makePublic') }}
      </ADialogToolbar>
      <VCardText>
        <AFormTextField
          v-if="assetType !== DamAssetTypeValue.Image"
          v-model="slug"
          :label="t('coreDam.asset.assetFilePublicLink.model.slug')"
          :v="v$"
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
