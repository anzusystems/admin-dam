<script lang="ts" setup>
import { computed } from 'vue'
import type { UploadQueueItem } from '@/types/coreDam/UploadQueue'
import { QueueItemStatus } from '@/types/coreDam/UploadQueue'
import { useI18n } from 'vue-i18n'
import { useRemainingTime } from '@anzusystems/common-admin'

const { t } = useI18n()

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
  return [
    QueueItemStatus.Waiting,
    QueueItemStatus.Uploading,
    QueueItemStatus.Loading,
    QueueItemStatus.Processing,
  ].includes(props.item.status)
})

const loadingProgress = computed(() => {
  return props.item.progress.progressPercent
})

const cancelItem = () => {
  emit('cancelItem', { index: props.index, item: props.item, queueId: props.queueId })
}

const showCancel = computed(() => {
  return [QueueItemStatus.Loading, QueueItemStatus.Waiting, QueueItemStatus.Uploading].includes(props.item.status)
})

const { remainingTimeShort } = useRemainingTime()
</script>

<template>
  <div class="dam-upload-queue__item">
    <div class="dam-upload-queue__item-card">
      <div class="d-flex align-center w-100">
        <div class="position-relative pr-1">
          <div
            class="dam-upload-queue__item-status align-center justify-center"
            :class="{ 'dam-upload-queue__item-status--permanent': !showCancel }"
          >
            <VProgressCircular
              v-if="loading"
              color="primary"
              :indeterminate="loadingProgress === null"
              :size="16"
              :width="3"
              :model-value="loadingProgress ? loadingProgress : undefined"
            />
            <VIcon
              v-else-if="item.error.hasError"
              icon="mdi-alert"
              color="error"
              :size="16"
            />
            <VIcon
              v-else-if="item.isDuplicate"
              icon="mdi-alert"
              color="warning"
              data-cy="icon-duplicate"
              :size="16"
            />
            <VIcon
              v-else
              icon="mdi-check"
              color="success"
              :size="16"
            />
          </div>
          <VBtn
            v-if="showCancel"
            icon
            variant="text"
            :width="16"
            :height="16"
            class="dam-upload-queue__item-remove"
            @click.stop="cancelItem"
          >
            <VIcon
              icon="mdi-close-circle-outline"
              :size="16"
            />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.button.cancel') }}
            </VTooltip>
          </VBtn>
        </div>
        <div class="text-caption text-truncate">
          {{ item.displayTitle || t('coreDam.asset.list.noTitle') }}
          <VTooltip
            v-if="item.displayTitle"
            activator="parent"
            location="bottom"
          >
            {{ item.displayTitle }}
          </VTooltip>
        </div>
        <div
          v-if="item.progress.remainingTime && item.progress.remainingTime > 0"
          class="ml-auto text-caption font-weight-bold text-no-wrap"
        >
          {{ remainingTimeShort(item.progress.remainingTime) }}
        </div>
      </div>
    </div>
  </div>
</template>
