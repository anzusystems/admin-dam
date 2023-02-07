<script lang="ts" setup>
import { useVModels } from '@vueuse/core'
import ADatetimePicker from '@/components/common/ADatetimePicker.vue'
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
</script>

<template>
  <ADatetimePicker
    v-model="modelValue.model"
    :clearable="!modelValue.mandatory"
    :default-value="modelValue.default"
    :label="modelValue.title"
  />
</template>
