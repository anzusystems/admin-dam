<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { useDistributionServiceType } from '@/model/dam/valueObject/DistributionServiceType'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    multiple?: boolean
    label?: string
    dataCy?: string
  }>(),
  {
    multiple: false,
    dataCy: '',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', data: string[]): void
  (e: 'blur', data: string[]): void
}>()

const modelValue = useVModel(props, 'modelValue', emit)

const onBlur = () => {
  emit('blur', modelValue.value)
}

const { allDistributionServiceTypeOptions } = useDistributionServiceType()
</script>

<template>
  <VSelect
    :items="allDistributionServiceTypeOptions"
    v-model="modelValue"
    item-title="title"
    item-value="value"
    :label="label"
    :multiple="multiple"
    clearable
    no-filter
    @blur="onBlur"
    :data-cy="dataCy"
  >
  </VSelect>
</template>
