<script setup lang="ts">
import {
  ADamUploadQueueList,
  UploadQueueItemStatus,
  UploadQueueSuggestionsKey,
  useAlerts,
} from '@anzusystems/common-admin'
import type { UploadQueueListBinding } from '@anzusystems/common-admin'
import { computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()
const uploadQueuesStore = useUploadQueuesStore()
const { currentExtSystemId } = useCurrentExtSystem()

// Picked assets wait for their metadata. A mass operation would see them empty, and the metadata would then overwrite it.
const metadataLoading = computed(() =>
  uploadQueuesStore.getQueueItems(props.queueId).some((item) => item.status === UploadQueueItemStatus.Loading)
)
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
        class="d-flex w-100 h-100 position-relative"
        :inert="!massOperations"
      >
        <div
          class="d-flex w-100 h-100"
          :class="{ 'opacity-50': metadataLoading }"
          :inert="metadataLoading"
        >
          <AssetQueueSelectedSidebar :queue-id="queueId" />
        </div>
        <div
          v-if="metadataLoading"
          class="asset-queue-editable__metadata-loading position-absolute w-100 h-100 d-flex align-center justify-center pa-4"
          role="status"
        >
          <VSheet
            class="d-flex align-center ga-3 pa-3 text-body-medium"
            elevation="2"
            rounded
          >
            <VProgressCircular
              indeterminate
              size="20"
              width="2"
            />
            {{ t('coreDam.asset.massOperations.waitingForMetadata') }}
          </VSheet>
        </div>
      </div>
    </template>
  </ADamUploadQueueList>
</template>

<style lang="scss" scoped>
.asset-queue-editable__metadata-loading {
  inset: 0;
}
</style>
