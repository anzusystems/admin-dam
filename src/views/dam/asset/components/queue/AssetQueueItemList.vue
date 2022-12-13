<script lang="ts" setup>
import { computed } from 'vue'
import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import { QueueItemStatus } from '@/types/dam/UploadQueue'

const props = withDefaults(
  defineProps<{
    index: number
    item: UploadQueueItem
    queueId: string
  }>(),
  {}
)

const loading = computed(() => {
  return [QueueItemStatus.Waiting, QueueItemStatus.Uploading, QueueItemStatus.Loading].includes(props.item.status)
})
const loadingProgress = computed(() => {
  return props.item.progress.progressPercent
})
</script>

<template>
  <div class="dam-upload-queue__item d-flex">
    <div class="dam-upload-queue__item-card">
      <div class="d-flex align-center w-100">
        <VProgressCircular
          v-if="loading"
          color="primary"
          :indeterminate="loadingProgress === null"
          :size="16"
          :width="3"
          class="mr-1"
          :model-value="loadingProgress ? loadingProgress : undefined"
        >
        </VProgressCircular>
        <VIcon v-else-if="item.error.hasError" icon="mdi-alert" color="error" :size="16" class="mr-1"></VIcon>
        <VIcon v-else icon="mdi-check" color="success" :size="16" class="mr-1"></VIcon>
        <div class="text-caption line-clamp-1">{{ item.displayTitle || 'no title, todo' }}</div>
      </div>
    </div>
  </div>
</template>
