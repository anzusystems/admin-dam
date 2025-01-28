<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    displayImage: boolean
    isVideo: boolean
    isAudio: boolean
    isImage: boolean
    isDocument: boolean
    isEmpty: boolean
    src: string
    backgroundColor: string
    width: number
    height: number
  }>(),
  {}
)

const icon = computed(() => {
  if (props.isAudio) {
    return 'mdi-music'
  }
  if (props.isDocument) {
    return 'mdi-note'
  }
  if (props.isVideo) {
    return 'mdi-video'
  }
  if (props.isEmpty) {
    return 'mdi-file-hidden'
  }
  return ''
})
</script>

<template>
  <img
    v-if="displayImage"
    :height="height"
    :src="src"
    :width="width"
    alt=""
    :style="'background-color:' + backgroundColor"
  >
  <div
    v-else
    :style="{ height: height + 'px', backgroundColor: '#ccc', width: '100%' }"
    style="width: 100%; min-width: 200px"
    class="asset-list-item-image-placeholder d-flex align-center justify-center"
  >
    <VIcon
      v-if="icon.length"
      size="100"
      :icon="icon"
      color="#363636"
    />
  </div>
</template>
