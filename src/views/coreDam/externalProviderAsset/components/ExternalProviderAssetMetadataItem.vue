<script setup lang="ts">
import { computed } from 'vue'
import { ABooleanValue, isArray, isBoolean } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    value: string | number | string[] | number[] | boolean
  }>(),
  {}
)

const valueComputed = computed(() => {
  if (isArray(props.value)) {
    return props.value
  }
  return [props.value]
})
</script>

<template>
  <div
    v-if="isBoolean(value)"
    class="d-inline-flex"
  >
    <ABooleanValue :value="value" />
  </div>
  <div
    v-for="item in valueComputed"
    v-else
    :key="item + ''"
    class="d-inline-flex"
  >
    <span>{{ item }}<br></span>
  </div>
</template>
