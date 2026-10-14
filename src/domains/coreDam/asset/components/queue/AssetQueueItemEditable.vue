<script lang="ts" setup>
import {
  AActionDeleteButton,
  ADamUploadQueueItem,
  UploadQueueItemStatus,
  isNull,
  useAlerts,
  usePageNavigation,
} from '@anzusystems/common-admin'
import type { AssetCustomData, DocId, UploadQueueItem, UploadQueueItemStatusType } from '@anzusystems/common-admin'
import { onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchAsset } from '@/domains/coreDam/asset/api/assetApi'
import AssetLink from '@/domains/coreDam/asset/components/AssetLink.vue'
import { assetDeleteOnItsWay, deleteAssetOnce } from '@/domains/coreDam/asset/composables/assetDeleteOnce'
import { useAssetInNewTab } from '@/domains/coreDam/asset/composables/assetInNewTab'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { ACL } from '@/domains/system/auth/auth'

const props = withDefaults(
  defineProps<{
    index: number
    queueId: string
    customData: AssetCustomData
    keywords: DocId[]
    authors: DocId[]
    item: UploadQueueItem
    refreshDisabled: boolean
    mainFileSingleUse: boolean | null
    disableDoneAnimation?: boolean
  }>(),
  {
    disableDoneAnimation: false,
  }
)

const emit = defineEmits<{
  (e: 'update:customData', data: AssetCustomData): void
  (e: 'update:keywords', data: DocId[]): void
  (e: 'update:authors', data: DocId[]): void
  (e: 'update:mainFileSingleUse', data: boolean | null): void
  (e: 'cancelItem', data: { index: number; item: UploadQueueItem; queueId: string }): void
  (e: 'refreshItem', data: { index: number; assetId: DocId; item: UploadQueueItem }): void
}>()

const { t } = useI18n()
const { currentExtSystemId } = useCurrentExtSystem()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const uploadQueuesStore = useUploadQueuesStore()

const { showRecordWas, showErrorsDefault } = useAlerts()
// A failure that ends after the user went elsewhere has nothing to say there.
const { onPage } = usePageNavigation()
const { opensInNewTab, openAssetInNewTab } = useAssetInNewTab()

// Processing too: the server may take long over a file, and the row is asked about for as long as it stays. And
// `Failed`: delete is no answer there - a refused import never created an asset.
const CANCEL_STATUSES: readonly UploadQueueItemStatusType[] = [
  UploadQueueItemStatus.Loading,
  UploadQueueItemStatus.Waiting,
  UploadQueueItemStatus.Uploading,
  UploadQueueItemStatus.Processing,
  UploadQueueItemStatus.Failed,
]

const SHOW_REFRESH_AFTER_SECONDS = 20
const showRefresh = ref(false)
const refreshTimer: Ref<ReturnType<typeof setTimeout> | undefined> = ref(undefined)

const showDetail = async () => {
  const assetId = props.item.assetId
  if (isNull(assetId)) return
  /* On a page that draws no detail of an asset the one of the row is shown on its own page, in a new tab: nothing
   * of this page is read, and nothing of it replaced. */
  if (opensInNewTab()) {
    openAssetInNewTab(assetId)

    return
  }
  /* The read below replaces what the panel beside the list holds, also when that is the asset of this row: metadata
   * typed into the panel and not saved go only when told to. Asked before anything changes; by the answer the row can
   * be of another asset. */
  if (assetDetailStore.panelHoldsUnsavedMetadata) {
    if (!(await assetDetailStore.askToLeaveUnsaved())) return
    if (props.item.assetId !== assetId) return
  }
  assetDetailStore.setView('queue')
  assetListStore.keyboardNavigationDisable()
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  // Counted in the store: this dialog and the list write to one detail.
  const detailRequest = assetDetailStore.startDetailRequest()
  try {
    const asset = await fetchAsset(assetId)
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    assetDetailStore.setAsset(asset)
  } catch (error) {
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    const dialogWasOpen = assetDetailStore.detail
    // Cleared, not merely closed: the panel behind renders the same asset.
    assetDetailStore.reset()
    assetListStore.keyboardNavigationEnable()
    // If it is already closed, the user has stopped waiting for this answer.
    if (!dialogWasOpen || !onPage()) return
    showErrorsDefault(error)
  } finally {
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
  }
}
/* The asset is deleted, and what else holds it is told, as a delete in the detail tells it: the tile of the asset in
 * the list and the detail or the panel beside the list are marked as deleting, and what was typed into the form of
 * the asset is no longer unsaved. Through the stores, not by an event: the queue can be closed while the delete is on
 * its way, and what an unmounted component emits Vue drops. One delete of the asset at a time: the bin is disabled
 * while it is on its way, and a press that comes all the same sends nothing. */
const remove = async () => {
  const assetId = props.item.assetId
  if (!assetId) return
  const queueId = props.queueId
  const item = props.item
  try {
    if (!(await deleteAssetOnce(assetId))) return
    // The row itself: the index can shift onto another row meanwhile, and rows can share an asset.
    const index = uploadQueuesStore.getQueueItems(queueId).indexOf(item)
    if (index !== -1) uploadQueuesStore.removeByIndex(queueId, index)
    assetListStore.setDeletingById(assetId)
    if (assetDetailStore.asset?.id === assetId) assetDetailStore.setDeleting()
    showRecordWas('deleted')
  } catch (error) {
    showErrorsDefault(error)
  }
}

const stillRunning = (status: UploadQueueItemStatusType) =>
  status === UploadQueueItemStatus.Uploading || status === UploadQueueItemStatus.Processing

// When the row offers refresh is admin-dam's own rule, handed to the row of the library.
watch(
  () => props.item.status,
  async (newValue) => {
    clearTimeout(refreshTimer.value)
    refreshTimer.value = undefined
    if (stillRunning(newValue)) {
      refreshTimer.value = setTimeout(() => {
        // The status when the timer fires, not when it was set.
        if (stillRunning(props.item.status)) showRefresh.value = true
      }, SHOW_REFRESH_AFTER_SECONDS * 1000)

      return
    }
    if (newValue === UploadQueueItemStatus.Uploaded) {
      // A failure has already been reported; the button is what the user can undo it with.
      if (props.item.error.hasError) {
        showRefresh.value = true

        return
      }
      showRefresh.value = false
      // A duplicate is not given metadata to edit, so there is nothing for refresh to fetch.
      if (props.item.canEditMetadata || props.item.isDuplicate) return
      /* Without its metadata the form stays disabled and the bulk save skips the row; refresh is the way back
       * the user has. */
      refreshTimer.value = setTimeout(() => {
        if (props.item.status !== UploadQueueItemStatus.Uploaded) return
        if (props.item.canEditMetadata || props.item.isDuplicate) return
        showRefresh.value = true
      }, SHOW_REFRESH_AFTER_SECONDS * 1000)

      return
    }
    // Failed or stopped: no refresh. A failed row whose file the server did finish comes back with its processed
    // notification.
    showRefresh.value = false
  },
  { immediate: true }
)

watch(
  () => props.item.canEditMetadata,
  (canEdit) => {
    // The metadata notification can arrive after the file one; the button is only for its absence.
    if (canEdit && props.item.status === UploadQueueItemStatus.Uploaded && !props.item.error.hasError) {
      clearTimeout(refreshTimer.value)
      refreshTimer.value = undefined
      showRefresh.value = false
    }
  }
)

onUnmounted(() => {
  clearTimeout(refreshTimer.value)
  refreshTimer.value = undefined
})
</script>

<template>
  <ADamUploadQueueItem
    :index="index"
    :queue-key="queueId"
    :ext-system="currentExtSystemId"
    :custom-data="customData"
    :keywords="keywords"
    :authors="authors"
    :main-file-single-use="mainFileSingleUse"
    :item="item"
    :refresh-disabled="refreshDisabled"
    :disable-done-animation="disableDoneAnimation"
    :cancel-statuses="CANCEL_STATUSES"
    :duplicate-notice="false"
    disable-form-on-duplicate
    :validation-scope="AssetMetadataValidationScopeSymbol"
    disabled-fields-as="input"
    hide-edit-on-duplicate
    :refresh-offered="showRefresh"
    @update:custom-data="emit('update:customData', $event)"
    @update:keywords="emit('update:keywords', $event)"
    @update:authors="emit('update:authors', $event)"
    @update:main-file-single-use="emit('update:mainFileSingleUse', $event)"
    @cancel-item="emit('cancelItem', { index: $event.index, item: $event.item, queueId: $event.queueKey })"
    @refresh-item="emit('refreshItem', { ...$event, item })"
  >
    <template #image-overlay>
      <div
        v-if="item.isDuplicate"
        :class="
          'dam-upload-queue__overlay dam-upload-queue__overlay--warning' +
          ' d-flex align-center justify-center flex-column'
        "
      >
        <VIcon
          icon="mdi-alert"
          class="ma-1"
          size="x-small"
          color="warning"
        />
        <div class="text-warning">
          {{ t('coreDam.asset.queueItem.duplicate') }}
        </div>
        <AssetLink
          v-if="item.duplicateAssetId"
          :asset-id="item.duplicateAssetId"
          variant="text"
          size="small"
        >
          {{ t('coreDam.asset.queueItem.viewOriginal') }}&nbsp;<VIcon icon="mdi-open-in-new" />
        </AssetLink>
      </div>
    </template>
    <template #edit>
      <VBtn
        size="small"
        variant="text"
        :disabled="!item.canEditMetadata"
        @click.stop="showDetail"
      >
        {{ t('coreDam.asset.queueItem.edit') }}
      </VBtn>
    </template>
    <template #remove>
      <AActionDeleteButton
        variant="icon"
        :acl="ACL.DAM_ASSET_DELETE"
        :disabled="(!item.canEditMetadata && !item.isDuplicate) || assetDeleteOnItsWay(item.assetId)"
        button-class=""
        @delete-record="remove"
      />
    </template>
  </ADamUploadQueueItem>
</template>
