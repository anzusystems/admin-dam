<script setup lang="ts">
import AssetQueueSelectedItemSimple from '@/views/dam/asset/components/queue/AssetQueueSelectedItemSimple.vue'
import { computed } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'

const uploadQueuesStore = useUploadQueuesStore()

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(QUEUE_ID_MASS_EDIT)
})
</script>

<template>
  <div class="dam-upload-queue dam-upload-queue--simple w-100 d-flex align-center justify-start">
    <AssetQueueSelectedItemSimple
      v-for="(item, index) in list"
      :key="item.assetId ? item.assetId : 'null'"
      :index="index"
      :item="item"
      :queue-id="QUEUE_ID_MASS_EDIT"
    />
  </div>
</template>
