<script setup lang="ts">
import { ADamUploadQueueList, UploadQueueSuggestionsKey, useAlerts } from '@anzusystems/common-admin'
import type { UploadQueueListBinding } from '@anzusystems/common-admin'
import { provide } from 'vue'

import AssetQueueItemEditable from '@/domains/coreDam/asset/components/queue/AssetQueueItemEditable.vue'
import AssetQueueSelectedSidebar from '@/domains/coreDam/asset/components/queue/AssetQueueSelectedSidebar.vue'
import { MASS_OPERATIONS_FROM } from '@/domains/coreDam/asset/components/queue/massOperations'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
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
const { currentExtSystemId } = useCurrentExtSystem()
const { showWarningT } = useAlerts()
const { addToCachedKeywords, fetchCachedKeywords } = useCachedKeywords()
const { addToCachedAuthors, fetchCachedAuthors } = useCachedAuthors()

// The list of the library over the store, the alerts and the name caches of admin-dam.
const queue: UploadQueueListBinding = {
  items: () => uploadQueuesStore.getQueueItems(props.queueId),
  // In the queue the row's event names, as before.
  cancel: (item, _index, queueId) => uploadQueuesStore.stopItemUpload(queueId, item),
  // A row is taken out by its own delete, which removes it from the store.
  remove: () => undefined,
  refresh: (item) => uploadQueuesStore.refreshQueueItem(item),
  refreshMayHelp: () => false,
  warn: (key) => showWarningT(key),
  prime: (items) => {
    items.forEach((item) => {
      addToCachedKeywords(item.keywords)
      addToCachedAuthors(item.authors)
    })
    fetchCachedKeywords()
    fetchCachedAuthors()
  },
  mainFileSingleUseEnabled: true,
}

// The name chips mark what the queue suggested as new: the queues are those of admin-dam's store.
provide(UploadQueueSuggestionsKey, (queueKey) => uploadQueuesStore.getQueue(queueKey)?.suggestions)
</script>

<template>
  <ADamUploadQueueList
    :queue-key="queueId"
    :ext-system="currentExtSystemId"
    :mass-operations="massOperations"
    :disable-done-animation="disableDoneAnimation"
    :queue="queue"
    :mass-operations-from="MASS_OPERATIONS_FROM"
    :keyboard-scroll="false"
  >
    <template #item="{ item, index, refreshDisabled, refresh }">
      <AssetQueueItemEditable
        v-model:custom-data="item.customData"
        v-model:keywords="item.keywords"
        v-model:authors="item.authors"
        v-model:main-file-single-use="item.mainFileSingleUse"
        :refresh-disabled="refreshDisabled"
        :item="item"
        :index="index"
        :queue-id="queueId"
        :disable-done-animation="disableDoneAnimation"
        @refresh-item="refresh()"
        @cancel-item="queue.cancel($event.item, $event.index, $event.queueId)"
      />
    </template>
    <template #sidebar>
      <!-- Closed, the panel is only slid out of view by the library: what it holds is left out for the keyboard and
           the screen reader as well. -->
      <div
        class="d-flex w-100 h-100"
        :inert="!massOperations"
      >
        <AssetQueueSelectedSidebar :queue-id="queueId" />
      </div>
    </template>
  </ADamUploadQueueList>
</template>
