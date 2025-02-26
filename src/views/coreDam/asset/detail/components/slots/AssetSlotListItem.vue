<script setup lang="ts">
import { fileDownloadLink } from '@/services/api/coreDam/fileApi'
import { QUEUE_ID_UPLOAD_SLOTS } from '@/services/upload/uploadQueueIds'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import AssetFileDuplicateChip from '@/views/coreDam/asset/components/AssetFileDuplicateChip.vue'
import AssetFileFailReasonChip from '@/views/coreDam/asset/components/AssetFileFailReasonChip.vue'
import AssetUpload from '@/views/coreDam/asset/components/AssetUpload.vue'
import ImageFile from '@/views/coreDam/asset/components/ImageFile.vue'
import AssetQueueItemList from '@/views/coreDam/asset/components/queue/AssetQueueItemList.vue'
import AssetSlotListItemDuplicate from '@/views/coreDam/asset/detail/components/slots/AssetSlotListItemDuplicate.vue'
import AssetSlotListItemRemove from '@/views/coreDam/asset/detail/components/slots/AssetSlotListItemRemove.vue'
import AssetSlotListItemSwitch from '@/views/coreDam/asset/detail/components/slots/AssetSlotListItemSwitch.vue'
import AssetFileMainRoute from '@/views/coreDam/assetFileRoute/components/AssetFileMainRoute.vue'
import {
  type AssetFileFailReasonType,
  assetFileIsVideoFile,
  AssetFileProcessStatus,
  DamAssetType,
  type DamAssetTypeType,
  type DocId,
  isUndefined,
  type UploadQueueItem,
  UploadQueueItemStatus,
  useAlerts,
} from '@anzusystems/common-admin'
import { useClipboard } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    slotName: string
    title: string
    item: AssetSlot | null
    assetType: DamAssetTypeType
    totalSlotCount: number
    assetId: DocId
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)

const emit = defineEmits<{
  (e: 'removeFile', fileId: DocId): void
  (e: 'makeMainFile', fileId: DocId): void
  (e: 'unsetSlot', data: { fileId: DocId; slotName: string }): void
  (e: 'duplicateSlot', data: { fileId: DocId; targetSlotName: string }): void
  (e: 'switchSlot', data: { sourceSlotName: string; targetSlotName: string }): void
  (e: 'refreshList'): void
}>()

const { t } = useI18n()
const uploadQueuesStore = useUploadQueuesStore()

const itemHasFile = computed(() => {
  return props.item && props.item.assetFile
})

const fileTitle = computed(() => {
  if (!props.item || !props.item.assetFile) return ''
  return props.item.assetFile.fileAttributes.originFileName
    ? props.item.assetFile.fileAttributes.originFileName
    : props.item.assetFile.id
})

const uploadQueueItemInAnyProgress = computed(() => {
  const item = uploadQueuesStore.getQueueItemForSlotItem(QUEUE_ID_UPLOAD_SLOTS, props.slotName, props.assetId)
  if (item && item.status !== UploadQueueItemStatus.Uploaded) return item
  return undefined
})

const uploadQueueItemInAnyProgressIndex = computed(() => {
  if (isUndefined(uploadQueueItemInAnyProgress.value)) return -1
  return uploadQueuesStore
    .getQueueItems(QUEUE_ID_UPLOAD_SLOTS)
    .findIndex(
      (item) =>
        item.assetId === uploadQueueItemInAnyProgress.value?.assetId &&
        item.slotName === uploadQueueItemInAnyProgress.value?.slotName
    )
})

const statusComputed = computed(() => {
  return props.item?.assetFile?.fileAttributes.status
})

const routableAssetFile = computed(() => {
  if (props.item?.assetFile && !assetFileIsVideoFile(props.item.assetFile)) return props.item.assetFile
  return null
})

watch(uploadQueueItemInAnyProgress, async (newValue, oldValue) => {
  if (isUndefined(newValue) && !isUndefined(oldValue)) {
    emit('refreshList')
  }
})

const removeAssetFile = () => {
  if (!props.item || !props.item.assetFile) return
  emit('removeFile', props.item.assetFile.id)
}

const downloadFile = async () => {
  if (!props.item || !props.item.assetFile) return
  const res = await fileDownloadLink(props.assetType, props.item.assetFile.id)
  window.open(res.link)
}

const { copy, isSupported: clipboardCopyIsSupported } = useClipboard()
const { showSuccess } = useAlerts()

const copyFileId = async () => {
  if (!props.item || !props.item.assetFile) return
  copy(props.item.assetFile.id).then(() => {
    showSuccess(t('common.alert.idWasCopied'))
  })
}

const makeMainFile = () => {
  if (!props.item || !props.item.assetFile) return
  emit('makeMainFile', props.item.assetFile.id)
}

const unsetSlot = () => {
  if (!props.item || !props.item.assetFile) return
  emit('unsetSlot', { fileId: props.item.assetFile.id, slotName: props.slotName })
}

const duplicateSlot = (targetName: string) => {
  if (!props.item || !props.item.assetFile) return
  emit('duplicateSlot', { fileId: props.item.assetFile.id, targetSlotName: targetName })
}

const switchSlot = (targetName: string) => {
  emit('switchSlot', { targetSlotName: targetName, sourceSlotName: props.slotName })
}

const cancelItem = (data: { index: number; item: UploadQueueItem; queueId: string }) => {
  uploadQueuesStore.stopItemUpload(data.queueId, data.item, data.index)
}
</script>

<template>
  <div class="pa-4 pb-8 text-body-2">
    <VRow v-if="uploadQueueItemInAnyProgress">
      <VCol>
        <div class="font-weight-bold">
          {{ slotName }}
        </div>
        <div class="dam-upload-queue dam-upload-queue--list w-100 h-100 d-block">
          <AssetQueueItemList
            v-if="uploadQueueItemInAnyProgressIndex > -1"
            :key="uploadQueueItemInAnyProgress.key"
            :index="uploadQueueItemInAnyProgressIndex"
            :item="uploadQueueItemInAnyProgress"
            :queue-id="QUEUE_ID_UPLOAD_SLOTS"
            @cancel-item="cancelItem"
          />
        </div>
      </VCol>
    </VRow>
    <VRow v-else>
      <VCol v-if="itemHasFile && item && item.assetFile">
        <div class="font-weight-bold">
          {{ slotName }} <span v-if="item && item.main">({{ t('coreDam.asset.slots.mainFile') }})</span>
          <AssetFileDuplicateChip
            v-if="statusComputed === AssetFileProcessStatus.Duplicate"
            class="ml-2"
          />
          <div v-if="statusComputed === AssetFileProcessStatus.Failed">
            {{ t('coreDam.distribution.common.failReason') }}:
            <AssetFileFailReasonChip
              class="ml-2"
              :reason="item?.assetFile?.fileAttributes.failReason as AssetFileFailReasonType"
            />
          </div>
        </div>
        <div>{{ fileTitle }}</div>
        <AssetFileMainRoute
          v-if="routableAssetFile"
          :asset-file="routableAssetFile"
          :asset-type="assetType"
          :title="title"
          @main-route-changed="emit('refreshList')"
        />
        <ImageFile
          v-if="assetType === DamAssetType.Image && item && item.assetFile"
          :model-value="item.assetFile.id"
          :height="200"
        />
      </VCol>
      <VCol v-else>
        <div class="font-weight-bold">
          {{ slotName }}
        </div>
        <div>{{ t('coreDam.asset.slots.noFile') }}</div>
      </VCol>
      <VCol
        cols="3"
        class="text-right"
      >
        <AssetUpload
          v-if="!itemHasFile"
          :height="40"
          variant="slot-upload"
          :queue-id="QUEUE_ID_UPLOAD_SLOTS"
          type="slots"
          :asset-id="assetId"
          :slot-name="slotName"
          :multiple="false"
          :asset-type="assetType"
        />
        <VBtn
          v-if="itemHasFile"
          variant="text"
          icon
          size="small"
          class="mx-1"
        >
          <VIcon
            icon="mdi-dots-horizontal"
            data-cy="button-slot-actions"
          />
          <VMenu activator="parent">
            <VCard min-width="300">
              <VList>
                <VListItem
                  v-if="clipboardCopyIsSupported"
                  :title="t('coreDam.asset.slots.actions.copyFileId')"
                  data-cy="button-slot-copy-id"
                  @click.stop="copyFileId"
                />
                <VListItem
                  :title="t('coreDam.asset.slots.actions.download')"
                  data-cy="button-slot-download"
                  @click.stop="downloadFile"
                />
                <VListItem
                  v-if="totalSlotCount > 1 && item && !item.main"
                  :title="t('coreDam.asset.slots.actions.makeMainFile')"
                  @click.stop="makeMainFile"
                />
                <AssetSlotListItemDuplicate
                  v-if="totalSlotCount > 1"
                  :item="item"
                  :file-title="fileTitle"
                  @duplicate-slot="duplicateSlot"
                />
                <AssetSlotListItemSwitch
                  v-if="totalSlotCount > 1"
                  :item="item"
                  :file-title="fileTitle"
                  @switch-slot="switchSlot"
                />
                <AssetSlotListItemRemove
                  :item="item"
                  :file-title="fileTitle"
                  @remove-file="removeAssetFile"
                  @unset-slot="unsetSlot"
                />
              </VList>
            </VCard>
          </VMenu>
          <VTooltip
            activator="parent"
            location="bottom"
          >
            {{ t('coreDam.asset.slots.actions.slotOptions') }}
          </VTooltip>
        </VBtn>
      </VCol>
    </VRow>
  </div>
</template>
