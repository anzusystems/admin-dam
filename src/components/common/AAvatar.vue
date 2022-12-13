<script lang="ts" setup>
import { computed } from 'vue'

// copy paste from old admin, todo

const props = withDefaults(
  defineProps<{
    data: any
    size?: number
    classes?: string
    left?: boolean
    right?: boolean
  }>(),
  {
    size: 48,
    classes: '',
    left: false,
    right: false,
  }
)

const fontSize = computed(() => {
  if (props.data.avatarText && props.data.avatarText.length === 3) return props.size * 0.35
  return props.size * 0.5
})

const validData = computed(() => {
  return !!(props.data && props.data.avatarText && props.data.avatarColor)
})
</script>

<template>
  <VAvatar v-if="validData" :class="classes" :color="data.avatarColor" :left="left" :right="right" :size="size">
    <VImg v-if="data.avatarImage && data.avatarImage.length > 0" :src="data.avatarImage"></VImg>
    <span
      v-else-if="data.avatarText && data.avatarText.length > 0"
      :style="`font-size: ${fontSize}px`"
      class="text-white"
    >
      {{ data.avatarText }}
    </span>
    <VIcon v-else class="white--text" icon="mdi-account" />
  </VAvatar>
</template>
