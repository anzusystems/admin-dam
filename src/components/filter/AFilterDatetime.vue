<script lang="ts" setup>
import ADatetimePicker from '@/components/common/ADatetimePicker.vue'
import type { Filter } from '@/types/Filter'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: any): void
}>()

const value = computed({
  get() {
    return props.modelValue.model
  },
  set(newValue) {
    emit('update:modelValue', { ...props.modelValue, ...{ model: newValue } })
  },
})
</script>

<template>
  <ADatetimePicker
    v-model="value"
    :clearable="!modelValue.mandatory"
    :default-value="modelValue.default"
    :label="modelValue.title"
  />
</template>
