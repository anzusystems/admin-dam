<script setup lang="ts">
import AssetQueueItemEditable from '@/views/coreDam/asset/components/queue/AssetQueueItemEditable.vue'
import { computed } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import AssetQueueSelectedSidebar from '@/views/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue'
import type { UploadQueueItem } from '@/types/coreDam/UploadQueue'

const props = withDefaults(
  defineProps<{
    queueId: string
    massOperations: boolean
    disableDoneAnimation?: boolean
  }>(),
  {
    disableDoneAnimation: false,
  }
)

const uploadQueuesStore = useUploadQueuesStore()

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(props.queueId)
})

const cancelItem = (data: { index: number; item: UploadQueueItem; queueId: string }) => {
  uploadQueuesStore.stopItemUpload(data.queueId, data.item, data.index)
}

const removeItem = (index: number) => {
  uploadQueuesStore.removeByIndex(props.queueId, index)
}
</script>

<template>
  <div class="asset-queue-editable" :class="{ 'asset-queue-editable--sidebar-active': massOperations }">
    <div class="asset-queue-editable__left">
      <div class="overflow-y-auto overflow-x-hidden h-100">
        <VRow class="dam-upload-queue dam-upload-queue--editable pa-2 mb-5">
          <AssetQueueItemEditable
            v-for="(item, index) in list"
            :key="item.key"
            v-model:customData="item.customData"
            v-model:keywords="item.keywords"
            v-model:authors="item.authors"
            :item="item"
            :index="index"
            :queue-id="queueId"
            :disable-done-animation="disableDoneAnimation"
            @cancel-item="cancelItem"
            @remove-item="removeItem"
          />
        </VRow>
      </div>
    </div>
    <div class="asset-queue-editable__sidebar system-border-l">
      <AssetQueueSelectedSidebar :queue-id="queueId" />
    </div>
  </div>
</template>