<script lang="ts" setup>
import { useFilterHelpers } from '@/composables/filter/filterHelpers'
import type { Filter } from '@/types/Filter'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: Filter
    dataCy?: string
  }>(),
  {
    dataCy: 'filter-id',
  }
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

const { clearOne } = useFilterHelpers()
</script>

<template>
  <VTextField
    v-model="value"
    :label="modelValue.title"
    :clearable="!modelValue.mandatory"
    @click:clear.stop="clearOne(modelValue)"
    :data-cy="dataCy"
  ></VTextField>
</template>
