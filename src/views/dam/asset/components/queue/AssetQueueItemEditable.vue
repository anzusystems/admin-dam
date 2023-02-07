<script lang="ts" setup>
import { computed } from 'vue'
import { deleteAsset, fetchAsset } from '@/services/api/dam/assetApi'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { isNull } from '@/utils/common'
import { useAssetListStore } from '@/stores/dam/assetListStore'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'
import KeywordSelect from '@/views/dam/keyword/components/KeywordSelect.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import AuthorSelect from '@/views/dam/author/components/AuthorSelect.vue'
import { useI18n } from 'vue-i18n'
import type { UploadQueueItem } from '@/types/dam/UploadQueue'
import { QueueItemStatus } from '@/types/dam/UploadQueue'
import AssetCustomMetadataForm from '@/components/dam/customMetadata/AssetCustomMetadataForm.vue'
import type { AssetCustomData } from '@/types/dam/Asset'
import type { DocId } from '@anzusystems/common-admin'
import { useKeywordAssetTypeConfig } from '@/views/dam/keyword/composables/keywordConfig'
import { useAuthorAssetTypeConfig } from '@/views/dam/author/composables/authorConfig'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import ADeleteButton from '@/components/common/buttons/action/ADeleteButton.vue'
import ACopyIdButton from '@/components/common/buttons/table/ACopyIdButton.vue'
import { prettyBytes } from '@/utils/file'

const IMAGE_ASPECT_RATIO = 16 / 9

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

const { t } = useI18n({ useScope: 'global' })

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()

const { showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const processing = computed(() => {
  return [QueueItemStatus.Processing, QueueItemStatus.Loading].includes(props.item.status)
})
const waiting = computed(() => {
  return props.item.status === QueueItemStatus.Waiting
})
const done = computed(() => {
  return !props.disableDoneAnimation && props.item.status === QueueItemStatus.Uploaded
})
const uploading = computed(() => {
  return props.item.status === QueueItemStatus.Uploading
})
const uploadProgress = computed(() => {
  return props.item.progress.progressPercent
})

const viewOriginal = async () => {
  // todo
}

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
    handleError(error)
  }
}
const imageSrc = computed(() => {
  return props.item.imagePreview ? props.item.imagePreview.url : undefined
})
const assetType = computed(() => {
  return props.item.assetType
})
const status = computed(() => {
  if (!props.item) return AssetStatus.Default
  return props.item.assetStatus
})

const { keywordEnabled, keywordRequired } = useKeywordAssetTypeConfig(assetType.value)
const { authorEnabled, authorRequired } = useAuthorAssetTypeConfig(assetType.value)

const cancelItem = () => {
  emit('cancelItem', { index: props.index, item: props.item, queueId: props.queueId })
}

const showCancel = computed(() => {
  return [QueueItemStatus.Loading, QueueItemStatus.Waiting, QueueItemStatus.Uploading].includes(props.item.status)
})
</script>

<template>
  <VCol xxl="2" xl="3" md="4" sm="6" cols="12">
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
            use-component
            cover
            :aspect-ratio="IMAGE_ASPECT_RATIO"
          />
          <div
            v-if="item.isDuplicate"
            class="dam-upload-queue__overlay dam-upload-queue__overlay--warning d-flex align-center justify-center flex-column"
          >
            <VIcon icon="mdi-alert" class="ma-1" size="x-small" color="warning" />
            <div class="text-warning">{{ t('coreDam.asset.queueItem.duplicate') }}</div>
            <VBtn v-if="item.duplicateAssetId" variant="text" size="small" @click.stop="viewOriginal">
              {{ t('coreDam.asset.queueItem.viewOriginal') }}
            </VBtn>
          </div>
          <div
            v-if="item.error.hasError"
            class="dam-upload-queue__overlay dam-upload-queue__overlay--error d-flex align-center justify-center flex-column"
          >
            <VIcon icon="mdi-alert" class="ma-1" size="x-small" color="error" />
            <div class="text-error">{{ t('coreDam.asset.queueItem.error') }}</div>
            <div v-if="item.error.message.length" class="text-caption" v-html="item.error.message" />
            <div v-else class="text-caption">{{ t('system.uploadErrors.unknownError') }}</div>
          </div>
        </div>
        <VRow dense class="my-2">
          <VCol>
            <div class="w-100 d-flex justify-space-between align-center">
              <div>
                <VBtn
                  v-if="!item.isDuplicate"
                  size="small"
                  :variant="item.canEditMetadata ? 'flat' : 'text'"
                  :color="item.canEditMetadata ? 'secondary' : undefined"
                  :disabled="!item.canEditMetadata"
                  @click.stop="showDetail"
                >
                  {{ t('coreDam.asset.queueItem.edit') }}
                </VBtn>
              </div>
              <div>
                <ACopyIdButton
                  v-if="item.assetId"
                  :id="item.assetId"
                  button-t="coreDam.asset.queueItem.copyAssetId"
                  size="small"
                />
                <VBtn v-if="showCancel" icon size="small" variant="text" @click.stop="cancelItem">
                  <VIcon icon="mdi-close-circle-outline" />
                  <VTooltip activator="parent" location="bottom">{{ t('common.button.cancel') }}</VTooltip>
                </VBtn>
                <ADeleteButton
                  variant="text"
                  :disabled="!item.canEditMetadata"
                  button-class=""
                  @delete-record="remove"
                />
              </div>
            </div>
          </VCol>
        </VRow>
        <VRow v-if="item.displayTitle" dense class="my-2 mb-3 mt-0 text-caption">
          <VCol class="pt-0">
            {{ t('coreDam.asset.queueItem.displayTitle') }}: {{ item.displayTitle }}
            <span v-if="item.file?.size">&nbsp;({{ prettyBytes(item.file.size) }})</span>
          </VCol>
        </VRow>
        <VForm :disabled="!item.canEditMetadata || item.isDuplicate">
          <AssetCustomMetadataForm v-if="item" v-model="customData" :asset-type="assetType">
            <template #after-pinned>
              <VRow v-if="keywordEnabled" dense class="my-2">
                <VCol>
                  <ASystemEntityScope subject="keyword" system="dam">
                    <KeywordSelect
                      v-model="keywords"
                      label="Keywords"
                      :suggestions="item.keywordSuggestions"
                      chips
                      clearable
                      multiple
                      :required="keywordRequired"
                      :validation-scope="AssetMetadataValidationScopeSymbol"
                      :disabled="!item.canEditMetadata"
                    />
                  </ASystemEntityScope>
                </VCol>
              </VRow>
              <VRow v-if="authorEnabled" dense class="my-2">
                <VCol>
                  <ASystemEntityScope subject="author" system="dam">
                    <AuthorSelect
                      v-model="authors"
                      label="Authors"
                      :suggestions="item.authorSuggestions"
                      chips
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
