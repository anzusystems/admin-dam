<script setup lang="ts">
import { ADamUploadQueueMassOperations } from '@anzusystems/common-admin'
import type { UploadQueueMassOperationsBinding } from '@anzusystems/common-admin'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'

const props = defineProps<{
  queueId: string
}>()

const uploadQueuesStore = useUploadQueuesStore()
const { currentExtSystemId } = useCurrentExtSystem()

// The admin-dam store writes keywords and authors only into rows whose asset type enables them.
const operations: UploadQueueMassOperationsBinding = {
  assetTypes: () => uploadQueuesStore.getQueueItemsTypes(props.queueId),
  fillCustomDataValue: (data, forceReplace) =>
    uploadQueuesStore.queueItemsReplaceEmptyCustomDataValue(props.queueId, data, forceReplace),
  fillKeywords: (value, forceReplace) =>
    uploadQueuesStore.queueItemsReplaceEmptyKeywords(props.queueId, value, forceReplace),
  fillAuthors: (value, forceReplace) =>
    uploadQueuesStore.queueItemsReplaceEmptyAuthors(props.queueId, value, forceReplace),
}
</script>

<template>
  <ADamUploadQueueMassOperations
    :queue-key="queueId"
    :ext-system="currentExtSystemId"
    :operations="operations"
  />
</template>
