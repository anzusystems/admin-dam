<script lang="ts" setup>
import type { DamConfigAssetCustomFormElement } from '@/types/dam/DamConfigAssetCustomForm'
import { CustomFormType } from '@/types/dam/DamConfigAssetCustomForm'
import { computed } from 'vue'
import type { ErrorObject } from '@vuelidate/core'
import { useVuelidate } from '@vuelidate/core'
import { maxLength, maxValue, minLength, minValue, requiredIf, stringArrayItemLength } from '@/plugins/validators'
import type { ValidationScope } from '@/types/Validation'

// todo: only string type si completely implemented, check other types

const props = withDefaults(
  defineProps<{
    modelValue: any
    config: DamConfigAssetCustomFormElement
    elementKey: string
    validationScope?: ValidationScope
  }>(),
  {
    validationScope: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: { key: string; value: any }): void
  (e: 'blur', data: any): void
}>()

const updateModelValue = (value: any) => {
  emit('update:modelValue', { key: props.elementKey, value })
}

const modelValueComputed = computed(() => {
  return props.modelValue
})

const rules = computed(() => {
  const dynamicRules: Record<string, any> = {
    modelValueComputed: {
      required: requiredIf(props.config.attributes.required),
    },
  }
  switch (props.config.attributes.type) {
    case CustomFormType.String:
      dynamicRules.modelValueComputed.minLength = minLength(
        props.config.attributes.minValue ? props.config.attributes.minValue : 0
      )
      dynamicRules.modelValueComputed.maxLength = maxLength(
        props.config.attributes.maxValue ? props.config.attributes.maxValue : 256
      )
      break
    case CustomFormType.Number:
      dynamicRules.modelValueComputed.minValue = minValue(
        props.config.attributes.minValue ? props.config.attributes.minValue : 0
      )
      dynamicRules.modelValueComputed.maxValue = maxValue(
        props.config.attributes.maxValue ? props.config.attributes.maxValue : 9999
      )
      break
    case CustomFormType.StringArray:
      dynamicRules.modelValueComputed.minLength = minLength(
        props.config.attributes.minCount ? props.config.attributes.minCount : 0
      )
      dynamicRules.modelValueComputed.maxLength = maxLength(
        props.config.attributes.maxCount ? props.config.attributes.maxCount : 32
      )
      dynamicRules.modelValueComputed.stringArrayItemLength = stringArrayItemLength(
        props.config.attributes.minValue ? props.config.attributes.minValue : 0,
        props.config.attributes.maxValue ? props.config.attributes.maxValue : 256
      )
      break
  }

  return dynamicRules
})

const v$ = useVuelidate(rules, { modelValueComputed }, { $scope: props.validationScope })

const errorMessageComputed = computed(() => {
  if (v$.value.$errors.length) return [v$.value.$errors.map((item: ErrorObject) => item.$message).join(' ')]
  return []
})

const onBlur = () => {
  emit('blur', props.modelValue)
  v$.value.$touch()
}
</script>

<template>
  <VTextarea
    :model-value="modelValue"
    v-if="config.attributes.type === CustomFormType.String"
    auto-grow
    :rows="1"
    :label="config.name"
    @update:model-value="updateModelValue"
    :error-messages="errorMessageComputed"
    @blur="onBlur"
  >
    <template #label>{{ config.name }}<span v-if="config.attributes.required" class="required"></span></template>
  </VTextarea>
  <VTextField
    :model-value="modelValue"
    v-else-if="config.attributes.type === CustomFormType.Number"
    type="number"
    :label="config.name"
    @update:model-value="updateModelValue"
    :error-messages="errorMessageComputed"
    @blur="onBlur"
  >
    <template #label>{{ config.name }}<span v-if="config.attributes.required" class="required"></span></template>
  </VTextField>
  <VCombobox
    :model-value="modelValue"
    v-else-if="config.attributes.type === CustomFormType.StringArray"
    :label="config.name"
    multiple
    chips
    @update:model-value="updateModelValue"
    :error-messages="errorMessageComputed"
    @blur="onBlur"
  >
    <template #label>{{ config.name }}<span v-if="config.attributes.required" class="required"></span></template>
  </VCombobox>
</template>
