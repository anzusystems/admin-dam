<script lang="ts" setup>
import type { Filter } from '@/types/Filter'
import { computed } from 'vue'
import AFilterValueObject from '@/components/filter/AFilterValueObject.vue'
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
  <AFilterValueObject v-model="value" :label="modelValue.title" :items="items" />
</template>
