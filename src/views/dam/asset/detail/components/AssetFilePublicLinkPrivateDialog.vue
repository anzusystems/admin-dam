<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import { AFormTextField, slugify, useAlerts, useErrorHandler } from '@anzusystems/common-admin'
import { makePublic } from '@/services/api/dam/audioApi'
import { maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    fileId: DocId
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

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()

const modelValueComputed = computed(() => {
  return props.modelValue
})

watch(modelValueComputed, async (newValue) => {
  if (newValue) {
    slug.value = slugify(props.title)
  }
})

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
    await makePublic(props.fileId, slugify(slug.value))
    showRecordWas('updated')
  } catch (e) {
    handleError(e)
  } finally {
    buttonLoading.value = false
    onCancel()
    emit('afterUpdate')
  }
}
</script>

<template>
  <VDialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <VCard v-if="modelValue" width="500" class="mt-0 mr-auto ml-auto">
      <VCardTitle class="d-flex pr-2">
        <span>Make file public</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <VCardText>
        <AFormTextField v-model="slug" :v="v$" />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" :loading="buttonLoading" data-cy="button-create-podcast" @click.stop="onConfirm">
          {{ t('common.button.confirm') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
