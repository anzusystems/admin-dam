<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    color?: string | null
    width?: number
    height?: number
  }>(),
  {
    width: 20,
    height: 20,
  }
)

const style = computed(() => {
  return `background-color: ${props.color ? props.color : 'transparent'}; width: ${props.width}px; height: ${
    props.height
  }px;`
})
</script>

<template>
  <div :style="style"></div>
</template>
