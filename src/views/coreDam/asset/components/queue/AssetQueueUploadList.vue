<script setup lang="ts">
import { computed } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import AssetQueueItemList from '@/views/coreDam/asset/components/queue/AssetQueueItemList.vue'
import type { UploadQueueItem } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    queueId?: string
  }>(),
  {
    queueId: QUEUE_ID_UPLOAD_GLOBAL,
  }
)

const uploadQueuesStore = useUploadQueuesStore()

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(props.queueId)
})

const cancelItem = (data: { index: number; item: UploadQueueItem; queueId: string }) => {
  uploadQueuesStore.stopItemUpload(data.queueId, data.item, data.index)
}
</script>

<template>
  <div class="dam-upload-queue dam-upload-queue--list w-100 h-100 d-block">
    <AssetQueueItemList
      v-for="(item, index) in list"
      :key="item.key"
      :index="index"
      :item="item"
      :queue-id="queueId"
      @cancel-item="cancelItem"
    />
  </div>
</template>
