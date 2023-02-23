<script setup lang="ts">
import { computed } from 'vue'
import { isArray, isBoolean } from '@/utils/common'
import { ABooleanValue } from '@anzusystems/common-admin'

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
    return props.value
  }
  return [props.value]
})
</script>

<template>
  <div v-if="isBooleanComputed" class="d-inline-flex">
    <ABooleanValue :value="value" />
  </div>
  <div v-for="item in valueComputed" v-else :key="item" class="d-inline-flex">
    <span>{{ item }}<br /></span>
  </div>
</template>
