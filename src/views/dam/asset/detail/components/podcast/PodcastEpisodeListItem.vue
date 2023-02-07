<script setup lang="ts">
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import LazyPodcastChip from '@/views/dam/podcast/components/LazyPodcastChip.vue'

withDefaults(
  defineProps<{
    item: PodcastEpisode
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
      <VCol>Podcast: <LazyPodcastChip :id="item.podcast" /></VCol>
    </VRow>
  </div>
</template>
