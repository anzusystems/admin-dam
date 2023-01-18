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
import type { DocId } from '@/types/common'
import { useKeywordAssetTypeConfig } from '@/views/dam/keyword/composables/keywordConfig'
import { useAuthorAssetTypeConfig } from '@/views/dam/author/composables/authorConfig'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import ADeleteButton from '@/components/common/buttons/action/ADeleteButton.vue'
import { useCurrentUser } from '@/composables/system/currentUser'
import ACopyText from '@/components/common/ACopyText.vue'

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
const { currentUserIsSuperAdmin } = useCurrentUser()

const { showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const processing = computed(() => {
  return props.item.status === QueueItemStatus.Processing
})
const waiting = computed(() => {
  return [QueueItemStatus.Waiting, QueueItemStatus.Loading].includes(props.item.status)
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
                v-if="!item.isDuplicate"
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
              <ADeleteButton variant="text" :disabled="!item.canEditMetadata" @delete-record="remove" />
            </div>
          </VCol>
        </VRow>
        <div v-if="currentUserIsSuperAdmin" class="text-caption">
          <VRow v-if="item.assetId">
            <VCol>{{ t('coreDam.asset.detail.info.field.id') }}</VCol>
            <VCol cols="9"><ACopyText :value="item.assetId" /></VCol>
          </VRow>
          <VRow v-if="item.fileId">
            <VCol>{{ t('coreDam.asset.detail.info.field.mainFileId') }}</VCol>
            <VCol cols="9"><ACopyText :value="item.fileId" /></VCol>
          </VRow>
        </div>
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
  </VCol>
</template>
