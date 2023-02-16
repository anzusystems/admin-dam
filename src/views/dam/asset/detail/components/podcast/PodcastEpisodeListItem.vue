<script setup lang="ts">
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import LazyPodcastChip from '@/views/dam/podcast/components/LazyPodcastChip.vue'
import type { DocId } from '@anzusystems/common-admin'
import ADeleteButton from '@/components/common/buttons/action/ADeleteButton.vue'

withDefaults(
  defineProps<{
    item: PodcastEpisode
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'deleteRecord', id: DocId): void
}>()
</script>

<template>
  <div class="d-flex align-center w-100 pa-4 pb-8 text-body-2">
    <div class="w-100">
      <div class="font-weight-bold">{{ item.texts.title }}</div>
      <div>Podcast: <LazyPodcastChip :id="item.podcast" /></div>
    </div>
    <div>
      <ADeleteButton @delete-record="emit('deleteRecord', item.id)" />
    </div>
  </div>
</template>
