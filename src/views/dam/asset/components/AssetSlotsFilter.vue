<script lang="ts" setup>
import type { Filter } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { AFilterValueObjectOptionsSelect } from '@anzusystems/common-admin'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'

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
  return [
    ...damConfigExtSystem.audio.slots,
    ...damConfigExtSystem.image.slots,
    ...damConfigExtSystem.video.slots,
    ...damConfigExtSystem.document.slots,
  ]
    .filter((value, index, array) => array.indexOf(value) === index)
    .map((item) => ({ title: item, value: item }))
})
</script>

<template>
  <AFilterValueObjectOptionsSelect v-model="value" :label="modelValue.title" :items="items" />
</template>
