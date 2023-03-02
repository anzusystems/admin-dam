<script lang="ts" setup>
import { computed } from 'vue'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import type { UploadQueueItem } from '@/types/coreDam/UploadQueue'
import { QueueItemStatus } from '@/types/coreDam/UploadQueue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    index: number
    item: UploadQueueItem
    queueId: string
  }>(),
  {}
)

const { t } = useI18n()

const processing = computed(() => {
  return [
    QueueItemStatus.Waiting,
    QueueItemStatus.Uploading,
    QueueItemStatus.Loading,
    QueueItemStatus.Processing,
  ].includes(props.item.status)
})
const imageSrc = computed(() => {
  return props.item.imagePreview ? props.item.imagePreview.url : undefined
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
          :show-processing="processing"
          use-component
          cover
          :icon-size="50"
          disable-processing-text
        />
        <div
          v-if="item.isDuplicate"
          class="dam-upload-queue__duplicate-overlay d-flex align-center justify-center flex-column"
        >
          <VIcon icon="mdi-alert" class="ma-1" size="x-small" color="orange-darken-3" />
          <div class="text-orange-darken-3">{{ t('coreDam.asset.detail.info.status.duplicate') }}</div>
        </div>
      </div>
      <div class="d-flex align-center w-100">
        <div />
        <div class="text-caption line-clamp-1">{{ item.displayTitle || t('coreDam.asset.list.noTitle') }}</div>
      </div>
    </div>
  </div>
</template>
