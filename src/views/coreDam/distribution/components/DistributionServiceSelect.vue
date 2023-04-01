<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import { useDistributionServiceType } from '@/model/coreDam/valueObject/DistributionServiceType'

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    multiple?: boolean
    label?: string
    dataCy?: string
  }>(),
  {
    multiple: false,
    label: undefined,
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
    v-model="modelValue"
    :items="allDistributionServiceTypeOptions"
    item-title="title"
    item-value="value"
    :label="label"
    :multiple="multiple"
    clearable
    no-filter
    :data-cy="dataCy"
    @blur="onBlur"
  />
</template>
