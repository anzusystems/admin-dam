<script lang="ts" setup>
import { computed } from 'vue'
import { deleteAsset, fetchAsset } from '@/services/api/dam/assetApi'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { isNull } from '@/utils/common'
import { useAssetListStore } from '@/stores/dam/assetListStore'
import ADeleteButton from '@/components/common/buttons/action/ADeleteButton.vue'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { useUiHelper } from '@/composables/system/uiHelper'
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
import type { DocId } from '@/types/common'
import { useKeywordAssetTypeConfig } from '@/views/dam/keyword/composables/keywordConfig'
import { useAuthorAssetTypeConfig } from '@/views/dam/author/composables/authorConfig'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'

const IMAGE_ASPECT_RATIO = 16 / 9

const props = withDefaults(
  defineProps<{
    queueId: string
    customData: AssetCustomData
    keywords: DocId[]
    authors: DocId[]
    item: UploadQueueItem
    index: number
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'update:customData', data: AssetCustomData): void
  (e: 'update:keywords', data: DocId[]): void
  (e: 'update:authors', data: DocId[]): void
  (e: 'cancelItem', data: { index: number; item: UploadQueueItem; queueId: string }): void
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
const { closeDeleteDialog } = useUiHelper()

const processing = computed(() => {
  return props.item.status === QueueItemStatus.Processing
})
const waiting = computed(() => {
  return [QueueItemStatus.Waiting, QueueItemStatus.Loading].includes(props.item.status)
})
const uploading = computed(() => {
  return props.item.status === QueueItemStatus.Uploading
})
const uploadProgress = computed(() => {
  return props.item.progress.progressPercent
})

const uploadNew = async () => {
  // todo
}

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
  if (!props.item || !props.item.assetId) return
  try {
    await deleteAsset(props.item.assetId)
    showRecordWas('deleted')
  } catch (error) {
    handleError(error)
  } finally {
    closeDeleteDialog()
  }
}
const imageSrc = computed(() => {
  return props.item.links.length > 0 ? props.item.links[0].url : ''
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
          <VBtn variant="text" size="small" @click.stop="viewOriginal" v-if="item.duplicateAssetId">
            {{ t('coreDam.asset.queueItem.viewOriginal') }}
          </VBtn>
        </div>
        <div
          v-if="item.error.hasError"
          class="dam-upload-queue__overlay dam-upload-queue__overlay--error d-flex align-center justify-center flex-column"
        >
          <VIcon icon="mdi-alert" class="ma-1" size="x-small" color="error" />
          <div class="text-error">{{ t('coreDam.asset.queueItem.error') }}</div>
          <div v-if="item.error.message.length" class="text-caption" v-html="item.error.message"></div>
          <div v-else class="text-caption">{{ t('system.uploadErrors.unknownError') }}</div>
        </div>
      </div>
      <VRow dense class="my-2">
        <VCol>
          <div class="w-100 d-flex justify-space-between align-center">
            <VBtn
              v-if="item.isDuplicate"
              size="small"
              @click.stop="uploadNew"
              :disabled="!item.canEditMetadata"
              :variant="item.canEditMetadata ? 'flat' : 'text'"
              :color="item.canEditMetadata ? 'secondary' : undefined"
            >
              {{ t('coreDam.asset.queueItem.uploadNew') }}
            </VBtn>
            <VBtn
              v-else
              size="small"
              :variant="item.canEditMetadata ? 'flat' : 'text'"
              :color="item.canEditMetadata ? 'secondary' : undefined"
              @click.stop="showDetail"
              :disabled="!item.canEditMetadata"
            >
              {{ t('coreDam.asset.queueItem.edit') }}
            </VBtn>
            <VBtn icon variant="text" @click.stop="cancelItem" v-if="showCancel">
              <VIcon icon="mdi-close-circle-outline" />
              <VTooltip activator="parent" location="bottom">{{ t('common.button.cancel') }}</VTooltip>
            </VBtn>
            <ADeleteButton
              variant="text"
              @delete-record="remove"
              :disabled="!item.canEditMetadata"
              v-else
            ></ADeleteButton>
          </div>
        </VCol>
      </VRow>
      <VForm :disabled="!item.canEditMetadata || item.isDuplicate">
        <AssetCustomMetadataForm v-if="item" :asset-type="assetType" v-model="customData">
          <template #after-pinned>
            <VRow dense class="my-2" v-if="keywordEnabled">
              <VCol>
                <ASystemEntityScope subject="keyword" system="dam">
                  <KeywordSelect
                    label="Keywords"
                    v-model="keywords"
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
            <VRow dense class="my-2" v-if="authorEnabled">
              <VCol>
                <ASystemEntityScope subject="author" system="dam">
                  <AuthorSelect
                    label="Authors"
                    v-model="authors"
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
</template>
