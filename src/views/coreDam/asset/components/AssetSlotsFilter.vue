<script lang="ts" setup>
import { AFilterValueObjectOptionsSelect, type Filter, useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'
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

const { damConfigExtSystem } = useDamConfigState()

const items = computed(() => {
  return [
    ...damConfigExtSystem.value.audio.slots,
    ...damConfigExtSystem.value.image.slots,
    ...damConfigExtSystem.value.video.slots,
    ...damConfigExtSystem.value.document.slots,
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
  <AFilterValueObjectOptionsSelect
    v-model="value"
    :label="label"
    :items="items"
  />
</template>
