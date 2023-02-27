<script setup lang="ts">
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import LazyVideoShowChip from '@/views/coreDam/videoShow/components/LazyVideoShowChip.vue'

withDefaults(
  defineProps<{
    item: VideoShowEpisode
  }>(),
  {}
)
</script>

<template>
  <div class="pa-4 pb-8 text-body-2">
    <VRow>
      <VCol>
        <div class="font-weight-bold">{{ item.texts.title }}</div>
      </VCol>
    </VRow>
    <VRow>
      <VCol>VideoShow: <LazyVideoShowChip :id="item.videoShow" /></VCol>
    </VRow>
  </div>
</template>
