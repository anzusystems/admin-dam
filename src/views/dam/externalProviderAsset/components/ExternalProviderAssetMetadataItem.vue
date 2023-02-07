<script setup lang="ts">
import { computed } from 'vue'
import { isArray, isBoolean } from '@/utils/common'
import ABooleanValue from '@/components/common/ABooleanValue.vue'

const props = withDefaults(
  defineProps<{
    value: string | number | string[] | number[] | boolean
  }>(),
  {}
)

const isBooleanComputed = computed(() => {
  return isBoolean(props.value)
})

const valueComputed = computed(() => {
  if (isArray(props.value)) {
    return props.value.join('<br>')
  }
  return props.value
})
</script>

<template>
  <div v-if="isBooleanComputed" class="d-inline-flex">
    <ABooleanValue :value="value" />
  </div>
  <div v-else class="d-inline-flex" v-html="valueComputed" />
</template>
