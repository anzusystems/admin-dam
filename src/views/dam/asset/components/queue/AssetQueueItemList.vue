<script lang="ts" setup>
import { computed } from 'vue'
import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import { QueueItemStatus } from '@/types/dam/UploadQueue'
import { useI18n } from 'vue-i18n'
import { AssetCustomData } from '@/types/dam/Asset'
import { DocId } from '@/types/common'

const { t } = useI18n({ useScope: 'global' })

const props = withDefaults(
  defineProps<{
    index: number
    item: UploadQueueItem
    queueId: string
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'cancelItem', data: { index: number; item: UploadQueueItem; queueId: string }): void
}>()

const loading = computed(() => {
  return [QueueItemStatus.Waiting, QueueItemStatus.Uploading, QueueItemStatus.Loading].includes(props.item.status)
})

const loadingProgress = computed(() => {
  return props.item.progress.progressPercent
})

const cancelItem = () => {
  emit('cancelItem', { index: props.index, item: props.item, queueId: props.queueId })
}
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
        <VIcon v-else-if="item.isDuplicate" icon="mdi-alert" color="warning" :size="16" class="mr-1"></VIcon>
        <VIcon v-else icon="mdi-check" color="success" :size="16" class="mr-1"></VIcon>
        <div class="text-caption line-clamp-1">{{ item.displayTitle || '' }}</div>
        <VBtn icon variant="text" size="x-small" class="ml-1" @click.stop="cancelItem">
          <VIcon icon="mdi-close-circle" size="x-large" />
          <VTooltip activator="parent" location="bottom">{{ t('common.button.cancel') }}</VTooltip>
        </VBtn>
      </div>
    </div>
  </div>
</template>
