<script lang="ts" setup>
import { computed } from 'vue'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'
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
const imageSrc = computed(() => {
  return props.item.links.length > 0 ? props.item.links[0].url : ''
})
const assetType = computed(() => {
  return props.item.assetType
})
const status = computed(() => {
  if (!props.item) return AssetStatus.Default
  return props.item.assetStatus
})
</script>

<template>
  <div class="dam-upload-queue__item dam-upload-queue__item--simple d-flex flex-column">
    <div class="dam-upload-queue__item-card">
      <div class="position-relative">
        <AssetImage
          :asset-type="assetType"
          :asset-status="status"
          :src="imageSrc"
          background-color="#ccc"
          :width="160"
          :height="80"
          :fallback-height="80"
          :show-loading="loading"
          :loading-progress="loadingProgress"
          use-component
          cover
          :icon-size="50"
        />
        <div
          v-if="item.isDuplicate"
          class="dam-upload-queue__duplicate-overlay d-flex align-center justify-center flex-column"
        >
          <VIcon icon="mdi-alert" class="ma-1" size="x-small" color="orange-darken-3" />
          <div class="text-orange-darken-3">Duplicate</div>
        </div>
      </div>
      <div class="d-flex align-center w-100">
        <div></div>
        <div class="text-caption line-clamp-1">{{ item.displayTitle || 'no title, todo' }}</div>
      </div>
    </div>
  </div>
</template>
