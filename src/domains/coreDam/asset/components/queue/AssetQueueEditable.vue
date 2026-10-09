<script setup lang="ts">
import { UploadQueueItemStatus, useAlerts } from '@anzusystems/common-admin'
import type { DocId, UploadQueueItem } from '@anzusystems/common-admin'
import { computed, onMounted, ref } from 'vue'

import AssetQueueItemEditable from '@/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue'
import AssetQueueSelectedSidebar from '@/domains/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'

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
const refreshDisabled = ref(false)

const { showWarningT } = useAlerts()

const refreshItem = async (data: { index: number; assetId: DocId; item: UploadQueueItem }) => {
  /* The row itself, not its position nor its asset: the list can have moved under the click, and rows can share
   * an asset. A row that has left the queue meanwhile is not asked about. */
  const item = data.item
  if (!list.value.includes(item)) return
  refreshDisabled.value = true
  try {
    const statusBefore = item.status
    const outcome = await uploadQueuesStore.refreshQueueItem(item)
    if (outcome === 'pending') showWarningT('common.damImage.queueItem.stillUploadingOrProcessing')
    /* The read failed, or the asset is gone, and the user is told why - unless the row has come to its end
     * meanwhile, settled by a notification or stopped by the user: it says what became of it. A file that was
     * being sent and is processing now has not: nothing is known of it yet, and asking again may tell. */
    const ended =
      item.status !== statusBefore &&
      (item.status === UploadQueueItemStatus.Failed ||
        item.status === UploadQueueItemStatus.Uploaded ||
        item.status === UploadQueueItemStatus.Stop)
    if (outcome === 'error' && !ended) showWarningT('common.damImage.queueItem.refreshFailed')
  } finally {
    refreshDisabled.value = false
  }
}

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(props.queueId)
})

const cancelItem = (data: { index: number; item: UploadQueueItem; queueId: string }) => {
  uploadQueuesStore.stopItemUpload(data.queueId, data.item)
}

const removeItem = (assetId: DocId) => {
  uploadQueuesStore.removeByAssetId(props.queueId, assetId)
}

const { addToCachedKeywords, fetchCachedKeywords } = useCachedKeywords()
const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()

onMounted(() => {
  list.value.forEach((item) => {
    addToCachedKeywords(item.keywords)
    addToCachedAuthors(item.authors)
    // objectGetValues(item.authorSuggestions)
    //   .filter((ids) => ids.length > 1)
    //   .forEach((ids) => ids.filter((id) => addToCachedAuthors(id)))
  })
  fetchCachedKeywords()
  fetchCachedAuthors()
})
</script>

<template>
  <div
    class="asset-queue-editable"
    :class="{ 'asset-queue-editable--sidebar-active': massOperations }"
  >
    <div class="asset-queue-editable__left">
      <div class="overflow-y-auto overflow-x-hidden h-100">
        <VRow class="dam-upload-queue dam-upload-queue--editable pa-2 mb-5">
          <AssetQueueItemEditable
            v-for="(item, index) in list"
            :key="item.key"
            v-model:custom-data="item.customData"
            v-model:keywords="item.keywords"
            v-model:authors="item.authors"
            v-model:main-file-single-use="item.mainFileSingleUse"
            :refresh-disabled="refreshDisabled"
            :item="item"
            :index="index"
            :queue-id="queueId"
            :disable-done-animation="disableDoneAnimation"
            @refresh-item="refreshItem"
            @cancel-item="cancelItem"
            @remove-item="removeItem"
          />
        </VRow>
      </div>
    </div>
    <div
      v-if="list.length > 1"
      class="asset-queue-editable__sidebar border-s"
    >
      <AssetQueueSelectedSidebar :queue-id="queueId" />
    </div>
  </div>
</template>
