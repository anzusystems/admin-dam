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

// Binds the library's list to admin-dam's store, alerts and name caches.
const queue: UploadQueueListBinding = {
  items: () => uploadQueuesStore.getQueueItems(props.queueId),
  // Uses the row's event names inside the queue.
  cancel: (item, _index, queueId) => uploadQueuesStore.stopItemUpload(queueId, item),
  // A row is removed by its own delete, which removes it from the store.
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

// The name chips mark queue suggestions as new. The queues come from admin-dam's store.
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
      <!--
        When closed, the library only slides the panel out of view.
        Its content is also hidden from the keyboard and the screen reader.
      -->
      <div
        class="d-flex w-100 h-100"
        :inert="!massOperations"
      >
        <AssetQueueSelectedSidebar :queue-id="queueId" />
      </div>
    </template>
  </ADamUploadQueueList>
</template>
