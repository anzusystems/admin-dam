<script lang="ts" setup>
import type { Filter } from '@/types/Filter'
import { computed } from 'vue'
import { damConfig } from '@/services/DamConfigService'
import AFilterValueObject from '@/components/filter/AFilterValueObject.vue'

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
  <AFilterValueObject v-model="value" :label="modelValue.title" :items="items" />
</template>
