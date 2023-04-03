<script lang="ts" setup>
import type { DamConfigAssetCustomFormElement } from '@/types/coreDam/DamConfigAssetCustomForm'
import { CustomFormType } from '@/types/coreDam/DamConfigAssetCustomForm'
import { computed, isProxy, toRaw } from 'vue'
import type { ErrorObject } from '@vuelidate/core'
import { useVuelidate } from '@vuelidate/core'
import type { ValidationScope } from '@anzusystems/common-admin'
import { isEmptyObject, useValidate } from '@anzusystems/common-admin'

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
  const value = isProxy(props.modelValue) ? toRaw(props.modelValue) : props.modelValue
  if (props.config.attributes.type === CustomFormType.StringArray && isEmptyObject(value)) return []
  return value
})

const { maxLength, minLength, requiredIf, minValue, maxValue, stringArrayItemLength } = useValidate()

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
    v-if="config.attributes.type === CustomFormType.String"
    :model-value="modelValue"
    auto-grow
    :rows="1"
    :label="config.name"
    :error-messages="errorMessageComputed"
    @update:model-value="updateModelValue"
    @blur="onBlur"
  >
    <template #label>
      {{ config.name
      }}<span
        v-if="config.attributes.required"
        class="required"
      />
    </template>
  </VTextarea>
  <VTextField
    v-else-if="config.attributes.type === CustomFormType.Number"
    :model-value="modelValueComputed"
    type="number"
    :label="config.name"
    :error-messages="errorMessageComputed"
    @update:model-value="updateModelValue"
    @blur="onBlur"
  >
    <template #label>
      {{ config.name
      }}<span
        v-if="config.attributes.required"
        class="required"
      />
    </template>
  </VTextField>
  <VCombobox
    v-else-if="config.attributes.type === CustomFormType.StringArray"
    :model-value="modelValueComputed"
    :label="config.name"
    multiple
    chips
    :error-messages="errorMessageComputed"
    @update:model-value="updateModelValue"
    @blur="onBlur"
  >
    <template #label>
      {{ config.name
      }}<span
        v-if="config.attributes.required"
        class="required"
      />
    </template>
  </VCombobox>
  <VSwitch
    v-if="config.attributes.type === CustomFormType.Boolean && config.attributes.required === true"
    :label="config.name"
    :model-value="modelValueComputed"
    @update:model-value="updateModelValue"
  />
  <div
    v-if="config.attributes.type === CustomFormType.Boolean && config.attributes.required === false"
  >
    optional boolean todo
  </div>
</template>
