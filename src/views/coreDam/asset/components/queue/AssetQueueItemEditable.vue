<script lang="ts" setup>
import { computed } from 'vue'
import { deleteAsset, fetchAsset } from '@/services/api/coreDam/assetApi'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import {
  AActionDeleteButton,
  type AssetCustomData,
  AssetFileFailReason,
  ASystemEntityScope,
  ATableCopyIdButton,
  DamAssetStatus,
  type DocId,
  isNull,
  prettyBytes,
  type UploadQueueItem,
  UploadQueueItemStatus,
  useAlerts,
} from '@anzusystems/common-admin'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import KeywordRemoteAutocompleteWithCached
  from '@/views/coreDam/keyword/components/KeywordRemoteAutocompleteWithCached.vue'
import AuthorRemoteAutocompleteWithCached
  from '@/views/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue'
import { useI18n } from 'vue-i18n'
import AssetCustomMetadataForm from '@/components/coreDam/customMetadata/AssetCustomMetadataForm.vue'
import { useKeywordAssetTypeConfig } from '@/views/coreDam/keyword/composables/keywordConfig'
import { useAuthorAssetTypeConfig } from '@/views/coreDam/author/composables/authorConfig'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import AssetLink from '@/views/coreDam/asset/components/AssetLink.vue'
import AssetFileFailReasonChip from '@/views/coreDam/asset/components/AssetFileFailReasonChip.vue'

const props = withDefaults(
  defineProps<{
    index: number
    queueId: string
    customData: AssetCustomData
    keywords: DocId[]
    authors: DocId[]
    item: UploadQueueItem
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
  (e: 'cancelItem', data: { index: number; item: UploadQueueItem; queueId: string }): void
  (e: 'removeItem', index: number): void
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

const { t } = useI18n()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()

const { showRecordWas, showErrorsDefault } = useAlerts()

const processing = computed(() => {
  return [UploadQueueItemStatus.Processing, UploadQueueItemStatus.Loading].includes(props.item.status)
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

const showDetail = async () => {
  if (isNull(props.item.assetId)) return
  assetDetailStore.setView('queue')
  assetListStore.keyboardNavigationDisable()
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  assetDetailStore.setAsset(await fetchAsset(props.item.assetId))
  assetDetailStore.hideLoader()
}
const remove = async () => {
  if (!props.item.assetId) return
  try {
    await deleteAsset(props.item.assetId)
    emit('removeItem', props.index)
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
  if (!props.item) return DamAssetStatus.Default
  return props.item.assetStatus
})

// eslint-disable-next-line vue/no-ref-object-reactivity-loss
const { keywordEnabled, keywordRequired } = useKeywordAssetTypeConfig(assetType.value)
// eslint-disable-next-line vue/no-ref-object-reactivity-loss
const { authorEnabled, authorRequired } = useAuthorAssetTypeConfig(assetType.value)

const cancelItem = () => {
  emit('cancelItem', { index: props.index, item: props.item, queueId: props.queueId })
}

const showCancel = computed(() => {
  return [UploadQueueItemStatus.Loading, UploadQueueItemStatus.Waiting, UploadQueueItemStatus.Uploading].includes(
    props.item.status
  )
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
            :class="'dam-upload-queue__overlay dam-upload-queue__overlay--warning' +
              ' d-flex align-center justify-center flex-column'"
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
            :class="'dam-upload-queue__overlay dam-upload-queue__overlay--error' +
              ' d-flex align-center justify-center flex-column'"
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
              class="text-caption"
              v-text="item.error.message"
            />
            <div v-else-if="item.error.assetFileFailReason !== AssetFileFailReason.None">
              <AssetFileFailReasonChip :reason="item.error.assetFileFailReason" />
            </div>
            <div
              v-else
              class="text-caption"
            >
              {{ t('system.uploadErrors.unknownError') }}
            </div>
          </div>
        </div>
        <VRow
          dense
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
          dense
          class="my-2 mb-3 mt-0 text-caption"
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
                dense
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
                dense
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
            </template>
          </AssetCustomMetadataForm>
        </VForm>
      </div>
    </div>
  </VCol>
</template>
