<script setup lang="ts">
import AssetQueueItemEditable from '@/views/coreDam/asset/components/queue/AssetQueueItemEditable.vue'
import { computed, onMounted, ref } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import AssetQueueSelectedSidebar from '@/views/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue'
import {
  AssetFileProcessStatus,
  DamAssetStatus, DamAssetType,
  type DocId,
  type UploadQueueItem,
  useAlerts,
} from '@anzusystems/common-admin'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'
import { fetchAsset } from '@/services/api/coreDam/assetApi'

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

const refreshItem = async (data: { index: number; assetId: DocId }) => {
  refreshDisabled.value = true
  try {
    const asset = await fetchAsset(data.assetId)
    if (asset.attributes.assetStatus === DamAssetStatus.WithFile) {
      await uploadQueuesStore.queueItemProcessed(asset.id)
    } else if(asset.mainFile?.fileAttributes.status === AssetFileProcessStatus.Duplicate) {
      await uploadQueuesStore.queueItemDuplicate(asset.id, asset.mainFile.originAssetFile, asset.attributes.assetType)
    } else if (asset.mainFile?.fileAttributes.status === AssetFileProcessStatus.Failed) {
      await uploadQueuesStore.queueItemFailed(data.assetId, asset.mainFile.fileAttributes.failReason)
    } else {
      showWarningT('common.damImage.queueItem.stillUploadingOrProcessing')
    }
  } catch (e) {
    //
  } finally {
    refreshDisabled.value = false
  }
}

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(props.queueId)
})

const cancelItem = (data: { index: number; item: UploadQueueItem; queueId: string }) => {
  uploadQueuesStore.stopItemUpload(data.queueId, data.item, data.index)
}

const removeItem = (index: number) => {
  uploadQueuesStore.removeByIndex(props.queueId, index)
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
            v-model:customData="item.customData"
            v-model:keywords="item.keywords"
            v-model:authors="item.authors"
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
      class="asset-queue-editable__sidebar system-border-l"
    >
      <AssetQueueSelectedSidebar :queue-id="queueId" />
    </div>
  </div>
</template>
