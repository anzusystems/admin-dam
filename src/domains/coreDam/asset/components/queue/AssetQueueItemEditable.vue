<script lang="ts" setup>
import {
  AActionDeleteButton,
  ADamUploadQueueItem,
  UploadQueueItemStatus,
  isNull,
  useAlerts,
} from '@anzusystems/common-admin'
import type { AssetCustomData, DocId, UploadQueueItem, UploadQueueItemStatusType } from '@anzusystems/common-admin'
import { onUnmounted, ref, toRaw, watch } from 'vue'
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
import { useWhileOnPage } from '@/domains/system/composables/whileOnPage'

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
  'update:customData': [data: AssetCustomData]
  'update:keywords': [data: DocId[]]
  'update:authors': [data: DocId[]]
  'update:mainFileSingleUse': [data: boolean | null]
  cancelItem: [data: { index: number; item: UploadQueueItem; queueId: string }]
  refreshItem: [data: { index: number; assetId: DocId; item: UploadQueueItem }]
}>()

const { t } = useI18n()
const { currentExtSystemId } = useCurrentExtSystem()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const uploadQueuesStore = useUploadQueuesStore()

const { showRecordWas, showErrorsDefault } = useAlerts()
// A failure that ends after the user navigated away is not shown.
const whileOnPage = useWhileOnPage()
const { opensInNewTab, openAssetInNewTab } = useAssetInNewTab()

// `Processing` too: the server may take long over a file, and the row asks about it while it stays.
// `Failed` too: delete does not help there, because a refused import never created an asset.
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

const rowIsInItsQueue = () =>
  uploadQueuesStore.getQueueItems(props.queueId).some((row) => toRaw(row) === toRaw(props.item))

const showDetail = async (event?: MouseEvent) => {
  const assetId = props.item.assetId
  if (isNull(assetId)) return
  /*
   * On a page that draws no asset detail, the asset opens on its
   * own page in a new tab. This page is not read or replaced.
   * A double click opens only one tab.
   */
  if (opensInNewTab()) {
    if ((event?.detail ?? 0) > 1) return
    openAssetInNewTab(assetId)

    return
  }
  /*
   * The read replaces the panel content, also when it shows this row's
   * asset. Unsaved metadata are dropped only after confirmation.
   * Asked before anything changes. By the answer the row can
   * belong to another asset or be gone, so its props are stale.
   */
  if (assetDetailStore.panelHoldsUnsavedMetadata) {
    if (!(await assetDetailStore.askToLeaveUnsaved())) return
    if (props.item.assetId !== assetId || !rowIsInItsQueue()) return
  }
  assetDetailStore.setView('queue')
  assetListStore.keyboardNavigationDisable()
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  // Counted in the store because this dialog and the list write to the same detail.
  const detailRequest = assetDetailStore.startDetailRequest(assetId)
  try {
    const asset = await fetchAsset(assetId)
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    assetDetailStore.setAsset(asset, detailRequest)
  } catch (error) {
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    const dialogWasOpen = assetDetailStore.detail
    // Reset, not only closed, because the panel behind renders the same asset.
    assetDetailStore.reset()
    assetListStore.keyboardNavigationEnable()
    // A closed dialog means the user stopped waiting for this answer.
    if (!dialogWasOpen) return
    whileOnPage(() => showErrorsDefault(error))
  } finally {
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
  }
}
/*
 * Marks the asset as deleting in the list tile and the detail or
 * panel, and clears unsaved form state, like a delete in the detail.
 * Done through the stores, not an event: the queue can close during
 * the delete, and Vue drops events of an unmounted component.
 * Only one delete per asset: the bin is disabled meanwhile, and an extra press sends nothing.
 */
const remove = async () => {
  const assetId = props.item.assetId
  if (!assetId) return
  try {
    if (!(await deleteAssetOnce(assetId))) return
    // By asset id, not row position, which can shift meanwhile. Removes every row of the asset.
    uploadQueuesStore.removeRowsOfDeletedAsset(assetId)
    assetListStore.setDeletingById(assetId)
    if (assetDetailStore.asset?.id === assetId) assetDetailStore.setDeleting()
    showRecordWas('deleted')
  } catch (error) {
    showErrorsDefault(error)
  }
}

const stillRunning = (status: UploadQueueItemStatusType) =>
  status === UploadQueueItemStatus.Uploading || status === UploadQueueItemStatus.Processing

// When the row offers refresh is admin-dam's rule, passed to the library row.
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
      // The failure is already reported. The button lets the user recover from it.
      if (props.item.error.hasError) {
        showRefresh.value = true

        return
      }
      showRefresh.value = false
      // A duplicate gets no editable metadata, so refresh has nothing to fetch.
      if (props.item.canEditMetadata || props.item.isDuplicate) return
      /* Without metadata the form stays disabled and bulk save skips the row. Refresh is the user's only way back. */
      refreshTimer.value = setTimeout(() => {
        if (props.item.status !== UploadQueueItemStatus.Uploaded) return
        if (props.item.canEditMetadata || props.item.isDuplicate) return
        showRefresh.value = true
      }, SHOW_REFRESH_AFTER_SECONDS * 1000)

      return
    }
    // Failed or stopped: no refresh. A failed row whose file the
    // server finished returns with its processed notification.
    showRefresh.value = false
  },
  { immediate: true }
)

watch(
  () => props.item.canEditMetadata,
  (canEdit) => {
    // The metadata notification can arrive after the file one. The button is only for when it is missing.
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
