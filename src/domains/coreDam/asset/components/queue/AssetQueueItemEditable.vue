<script lang="ts" setup>
import AssetCustomMetadataForm from '@/domains/coreDam/shared/components/customMetadata/AssetCustomMetadataForm.vue'
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { deleteAsset, fetchAsset } from '@/domains/coreDam/asset/api/assetApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import AssetFileFailReasonChip from '@/domains/coreDam/asset/components/AssetFileFailReasonChip.vue'
import AssetImage from '@/domains/coreDam/asset/components/AssetImage.vue'
import AssetLink from '@/domains/coreDam/asset/components/AssetLink.vue'
import AuthorRemoteAutocompleteWithCached from '@/domains/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue'
import { useAuthorAssetTypeConfig } from '@/domains/coreDam/author/composables/authorConfig'
import KeywordRemoteAutocompleteWithCached from '@/domains/coreDam/keyword/components/KeywordRemoteAutocompleteWithCached.vue'
import { useKeywordAssetTypeConfig } from '@/domains/coreDam/keyword/composables/keywordConfig'
import {
  AActionDeleteButton,
  type AssetCustomData,
  AssetFileFailReason,
  ASystemEntityScope,
  ATableCopyIdButton,
  DamAssetStatusDefault,
  prettyBytes,
  type UploadQueueItem,
  UploadQueueItemStatus,
  type UploadQueueItemStatusType,
} from '@anzusystems/common-admin'

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
  (e: 'removeItem', assetId: DocId): void
  (e: 'refreshItem', data: { index: number; assetId: DocId }): void
}>()

const IMAGE_ASPECT_RATIO = 16 / 9

const customData = computed({
  get() {
    return props.customData
  },
  set(newValue) {
    emit('update:customData', { ...props.customData, ...newValue })
  },
})

const keywords = computed({
  get() {
    return props.keywords
  },
  set(newValue) {
    emit('update:keywords', [...newValue])
  },
})

const authors = computed({
  get() {
    return props.authors
  },
  set(newValue) {
    emit('update:authors', [...newValue])
  },
})

const mainFileSingleUse = computed({
  get() {
    return props.mainFileSingleUse
  },
  set(newValue) {
    emit('update:mainFileSingleUse', newValue)
  },
})

const { t } = useI18n()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()

const { showRecordWas, showErrorsDefault } = useAlerts()

const processing = computed(() => {
  return (
    [UploadQueueItemStatus.Processing, UploadQueueItemStatus.Loading] as unknown as UploadQueueItemStatusType
  ).includes(props.item.status)
})
const waiting = computed(() => {
  return props.item.status === UploadQueueItemStatus.Waiting
})
const done = computed(() => {
  return !props.disableDoneAnimation && props.item.status === UploadQueueItemStatus.Uploaded
})
const uploading = computed(() => {
  return props.item.status === UploadQueueItemStatus.Uploading
})
const uploadProgress = computed(() => {
  return props.item.progress.progressPercent
})

const SHOW_REFRESH_AFTER_SECONDS = 20
const showRefresh = ref(false)
const refreshTimer: Ref<ReturnType<typeof setTimeout> | undefined> = ref(undefined)

const refresh = () => {
  if (props.item.assetId) {
    emit('refreshItem', { index: props.index, assetId: props.item.assetId })
  }
}

const showDetail = async () => {
  if (isNull(props.item.assetId)) return
  assetDetailStore.setView('queue')
  assetListStore.keyboardNavigationDisable()
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  // Counted in the store: this dialog and the list write to one detail.
  const detailRequest = assetDetailStore.startDetailRequest()
  try {
    const asset = await fetchAsset(props.item.assetId)
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    assetDetailStore.setAsset(asset)
  } catch (error) {
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    const dialogWasOpen = assetDetailStore.detail
    // Cleared, not merely closed: the panel behind renders the same asset.
    assetDetailStore.reset()
    assetListStore.keyboardNavigationEnable()
    // If it is already closed, the user has stopped waiting for this answer.
    if (!dialogWasOpen) return
    showErrorsDefault(error)
  } finally {
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
  }
}
const remove = async () => {
  if (!props.item.assetId) return
  try {
    await deleteAsset(props.item.assetId)
    // By asset: the delete is awaited, and the index can shift onto another row meanwhile.
    emit('removeItem', props.item.assetId)
    showRecordWas('deleted')
  } catch (error) {
    showErrorsDefault(error)
  }
}
const imageSrc = computed(() => {
  return props.item.imagePreview ? props.item.imagePreview.url : undefined
})
const assetType = computed(() => {
  return props.item.assetType
})
const status = computed(() => {
  if (!props.item) return DamAssetStatusDefault
  return props.item.assetStatus
})

const { keywordEnabled, keywordRequired } = useKeywordAssetTypeConfig(assetType.value)

const { authorEnabled, authorRequired } = useAuthorAssetTypeConfig(assetType.value)

const cancelItem = () => {
  emit('cancelItem', { index: props.index, item: props.item, queueId: props.queueId })
}

const showCancel = computed(() => {
  return (
    [
      UploadQueueItemStatus.Loading,
      UploadQueueItemStatus.Waiting,
      UploadQueueItemStatus.Uploading,
      // Processing too: with no notification and no fallback it stays here until refresh or cancel.
      UploadQueueItemStatus.Processing,
      // And `Failed`: delete is no answer there - a refused import never created an asset.
      UploadQueueItemStatus.Failed,
    ] as unknown as UploadQueueItemStatusType
  ).includes(props.item.status)
})

const stillRunning = (status: UploadQueueItemStatusType) =>
  status === UploadQueueItemStatus.Uploading || status === UploadQueueItemStatus.Processing

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
      // A failure has already been reported; the button is the only thing that can undo it.
      if (props.item.error.hasError) {
        showRefresh.value = true

        return
      }
      showRefresh.value = false
      // A duplicate is not given metadata to edit, so there is nothing for refresh to fetch.
      if (props.item.canEditMetadata || props.item.isDuplicate) return
      /* Without its metadata notification the form stays disabled and the bulk save skips the row; refresh is the
       * only way back. */
      refreshTimer.value = setTimeout(() => {
        if (props.item.status !== UploadQueueItemStatus.Uploaded) return
        if (props.item.canEditMetadata || props.item.isDuplicate) return
        showRefresh.value = true
      }, SHOW_REFRESH_AFTER_SECONDS * 1000)

      return
    }
    // Failed or stopped: there is nothing left for a refresh to find.
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
  <VCol
    xxl="2"
    xl="3"
    md="4"
    sm="6"
    cols="12"
  >
    <div class="dam-upload-queue__item">
      <div class="dam-upload-queue__item-card">
        <div class="position-relative">
          <AssetImage
            :asset-type="assetType"
            :asset-status="status"
            :src="imageSrc"
            background-color="#ccc"
            :show-uploading="uploading"
            :show-processing="processing"
            :show-waiting="waiting"
            :show-done="done"
            :uploading-progress="uploadProgress"
            :remaining-time="item.progress.remainingTime"
            use-component
            cover
            :aspect-ratio="IMAGE_ASPECT_RATIO"
          />
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
          <div
            v-if="item.error.hasError"
            :class="
              'dam-upload-queue__overlay dam-upload-queue__overlay--error' +
                ' d-flex align-center justify-center flex-column'
            "
          >
            <VIcon
              icon="mdi-alert"
              class="ma-1"
              size="x-small"
              color="error"
            />
            <div class="text-error">
              {{ t('coreDam.asset.queueItem.error') }}
            </div>
            <div
              v-if="item.error.message.length"
              class="text-body-small"
              v-text="item.error.message"
            />
            <div v-else-if="item.error.assetFileFailReason !== AssetFileFailReason.None">
              <AssetFileFailReasonChip :reason="item.error.assetFileFailReason" />
            </div>
            <div
              v-else
              class="text-body-small"
            >
              {{ t('system.uploadErrors.unknownError') }}
            </div>
          </div>
        </div>
        <VRow
          density="compact"
          class="my-2"
        >
          <VCol>
            <div class="w-100 d-flex justify-space-between align-center">
              <div>
                <VBtn
                  v-if="!item.isDuplicate"
                  size="small"
                  variant="text"
                  :disabled="!item.canEditMetadata"
                  @click.stop="showDetail"
                >
                  {{ t('coreDam.asset.queueItem.edit') }}
                </VBtn>
              </div>
              <div>
                <ATableCopyIdButton
                  v-if="item.assetId"
                  :id="item.assetId"
                  button-t="coreDam.asset.queueItem.copyAssetId"
                  size="small"
                />
                <VBtn
                  v-if="showRefresh"
                  icon
                  size="small"
                  variant="text"
                  :disabled="refreshDisabled"
                  @click.stop="refresh"
                >
                  <VIcon icon="mdi-refresh" />
                  <VTooltip
                    activator="parent"
                    location="bottom"
                  >
                    {{ t('common.button.refresh') }}
                  </VTooltip>
                </VBtn>
                <VBtn
                  v-if="showCancel"
                  icon
                  size="small"
                  variant="text"
                  @click.stop="cancelItem"
                >
                  <VIcon icon="mdi-close-circle-outline" />
                  <VTooltip
                    activator="parent"
                    location="bottom"
                  >
                    {{ t('common.button.cancel') }}
                  </VTooltip>
                </VBtn>
                <AActionDeleteButton
                  variant="icon"
                  :disabled="!item.canEditMetadata && !item.isDuplicate"
                  button-class=""
                  @delete-record="remove"
                />
              </div>
            </div>
          </VCol>
        </VRow>
        <VRow
          v-if="item.displayTitle"
          density="compact"
          class="my-2 mb-3 mt-0 text-body-small"
        >
          <VCol class="pt-0">
            {{ t('coreDam.asset.queueItem.displayTitle') }}: {{ item.displayTitle }}
            <span v-if="item.file?.size">&nbsp;({{ prettyBytes(item.file.size) }})</span>
          </VCol>
        </VRow>
        <VForm :disabled="!item.canEditMetadata || item.isDuplicate">
          <AssetCustomMetadataForm
            v-if="item"
            v-model="customData"
            :asset-type="assetType"
          >
            <template #after-pinned>
              <VRow
                v-if="keywordEnabled"
                density="compact"
                class="my-2"
              >
                <VCol>
                  <ASystemEntityScope
                    subject="keyword"
                    system="dam"
                  >
                    <KeywordRemoteAutocompleteWithCached
                      v-model="keywords"
                      :queue-id="queueId"
                      :label="t('coreDam.asset.model.keywords')"
                      clearable
                      multiple
                      :required="keywordRequired"
                      :validation-scope="AssetMetadataValidationScopeSymbol"
                      :disabled="!item.canEditMetadata"
                    />
                  </ASystemEntityScope>
                </VCol>
              </VRow>
              <VRow
                v-if="authorEnabled"
                density="compact"
                class="my-2"
              >
                <VCol>
                  <ASystemEntityScope
                    subject="author"
                    system="dam"
                  >
                    <AuthorRemoteAutocompleteWithCached
                      v-model="authors"
                      :queue-id="queueId"
                      :label="t('coreDam.asset.model.authors')"
                      :author-conflicts="item.authorConflicts"
                      clearable
                      multiple
                      :required="authorRequired"
                      :validation-scope="AssetMetadataValidationScopeSymbol"
                      :disabled="!item.canEditMetadata"
                    />
                  </ASystemEntityScope>
                </VCol>
              </VRow>
              <VRow
                density="compact"
                class="my-2"
              >
                <VCol>
                  <VSwitch
                    v-model="mainFileSingleUse"
                    :label="t('common.damImage.asset.model.mainFileSingleUse')"
                  />
                </VCol>
              </VRow>
            </template>
          </AssetCustomMetadataForm>
        </VForm>
      </div>
    </div>
  </VCol>
</template>
