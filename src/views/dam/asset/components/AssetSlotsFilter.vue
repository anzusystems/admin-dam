<script lang="ts" setup>
import type { Filter } from '@anzusystems/common-admin'
import { AFilterValueObjectOptionsSelect } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()

const label = computed(() => {
  return props.modelValue.titleT ? t(props.modelValue.titleT) : undefined
})
</script>

<template>
  <AFilterValueObjectOptionsSelect v-model="value" :label="label" :items="items" />
</template>
