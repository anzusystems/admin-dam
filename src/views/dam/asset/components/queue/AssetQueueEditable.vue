<script setup lang="ts">
import AssetQueueItemEditable from '@/views/dam/asset/components/queue/AssetQueueItemEditable.vue'
import { computed } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import AssetQueueSelectedSidebar from '@/views/dam/asset/components/queue/AssetQueueSelectedSidebar.vue'

const props = withDefaults(
  defineProps<{
    queueId: string
    massOperations: boolean
  }>(),
  {}
)

const uploadQueuesStore = useUploadQueuesStore()

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(props.queueId)
})
</script>

<template>
  <div class="asset-queue-editable" :class="{ 'asset-queue-editable--sidebar-active': massOperations }">
    <div class="asset-queue-editable__left">
      <div class="overflow-y-auto overflow-x-hidden h-100">
        <VRow class="dam-upload-queue dam-upload-queue--editable pa-2 mb-5">
          <VCol xxl="2" xl="3" md="4" sm="6" cols="12" v-for="item in list" :key="item.assetId + ''">
            <AssetQueueItemEditable
              v-model:customData="item.customData"
              v-model:keywords="item.keywords"
              v-model:authors="item.authors"
              :item="item"
            />
          </VCol>
        </VRow>
      </div>
    </div>
    <div class="asset-queue-editable__sidebar system-border-l">
      <AssetQueueSelectedSidebar :queue-id="queueId" />
    </div>
  </div>
</template>
