<script setup lang="ts">
import { computed } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import AssetQueueItemList from '@/views/dam/asset/components/queue/AssetQueueItemList.vue'

const uploadQueuesStore = useUploadQueuesStore()

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(QUEUE_ID_UPLOAD_GLOBAL)
})
</script>

<template>
  <div class="dam-upload-queue dam-upload-queue--list w-100 h-100 d-block">
    <AssetQueueItemList
      v-for="(item, index) in list"
      :key="item.key"
      :index="index"
      :item="item"
      :queue-id="QUEUE_ID_UPLOAD_GLOBAL"
    />
  </div>
</template>
