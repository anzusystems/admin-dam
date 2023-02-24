<script lang="ts" setup>
import type { Filter } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { damConfig } from '@/services/DamConfigService'
import { AFilterValueObjectOptionsSelect } from '@anzusystems/common-admin'

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
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  },
})

const items = computed(() => {
  return Object.entries(damConfig.distributionServices).map(([key, value]) => {
    return {
      title: value.title,
      value: key,
    }
  })
})
</script>

<template>
  <AFilterValueObjectOptionsSelect v-model="value" :label="modelValue.title" :items="items" />
</template>
