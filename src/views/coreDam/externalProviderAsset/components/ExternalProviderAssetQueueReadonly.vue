<script setup lang="ts">
import { computed } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import ExternalProviderAssetQueueItemReadonly from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetQueueItemReadonly.vue'

const props = withDefaults(
  defineProps<{
    queueId: string
  }>(),
  {}
)

const uploadQueuesStore = useUploadQueuesStore()

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(props.queueId)
})

const removeItem = (index: number) => {
  uploadQueuesStore.removeByIndex(props.queueId, index)
}
</script>

<template>
  <div class="asset-queue-editable">
    <div class="asset-queue-editable__left">
      <div class="overflow-y-auto overflow-x-hidden h-100">
        <VRow class="dam-upload-queue dam-upload-queue--editable pa-2 mb-5">
          <VCol v-for="(item, index) in list" :key="item.assetId + ''" xxl="2" xl="3" md="4" sm="6" cols="12">
            <ExternalProviderAssetQueueItemReadonly :item="item" :index="index" @remove-item="removeItem" />
          </VCol>
        </VRow>
      </div>
    </div>
  </div>
</template>
