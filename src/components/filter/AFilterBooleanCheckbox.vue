<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Filter } from '@/types/Filter'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
}>()
const { modelValue } = useVModels(props, emit)

const { t } = useI18n({ useScope: 'global' })

const labelComputed = computed(() => {
  if (modelValue.value.model === null) return modelValue.value.title
  if (modelValue.value.model) return modelValue.value.title + ' (' + t('common.boolean.true') + ')'
  return modelValue.value.title + ' (' + t('common.boolean.false') + ')'
})
</script>

<template>
  <VCheckbox
    :indeterminate="modelValue.model === null"
    :label="labelComputed"
    :model-value="modelValue.model"
    false-icon="mdi-close-box"
    hide-details
    indeterminate-icon="mdi-checkbox-blank-outline"
  ></VCheckbox>
</template>
