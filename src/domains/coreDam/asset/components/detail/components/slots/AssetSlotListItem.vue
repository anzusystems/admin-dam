<script lang="ts">
/* The files whose address is asked for, by their id: a row drawn anew - another tab of the detail and back - is another
 * row, and a press in it opened a second tab and asked again. */
const downloadsOnTheirWay = new Set<string>()
</script>

<script setup lang="ts">
import {
  ADamAssetFileFailReasonChip,
  AssetFileProcessStatus,
  DamAssetType,
  UploadQueueItemStatus,
  assetFileIsVideoFile,
  isUndefined,
  useAlerts,
} from '@anzusystems/common-admin'
import type { AssetFileFailReasonType, DamAssetTypeType, DocId, UploadQueueItem } from '@anzusystems/common-admin'
import { useClipboard } from '@vueuse/core'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { fileDownloadLink } from '@/domains/coreDam/asset/api/fileApi'
import AssetFileDuplicateChip from '@/domains/coreDam/asset/components/AssetFileDuplicateChip.vue'
import AssetUpload from '@/domains/coreDam/asset/components/AssetUpload.vue'
import AssetSlotListItemDuplicate from '@/domains/coreDam/asset/components/detail/components/slots/AssetSlotListItemDuplicate.vue'
import AssetSlotListItemRemove from '@/domains/coreDam/asset/components/detail/components/slots/AssetSlotListItemRemove.vue'
import AssetSlotListItemSwitch from '@/domains/coreDam/asset/components/detail/components/slots/AssetSlotListItemSwitch.vue'
import ImageFile from '@/domains/coreDam/asset/components/ImageFile.vue'
import AssetQueueItemList from '@/domains/coreDam/asset/components/queue/AssetQueueItemList.vue'
import { openTabForAddress } from '@/domains/coreDam/asset/composables/assetInNewTab'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import AssetFileMainRoute from '@/domains/coreDam/shared/assetFileRoute/components/AssetFileMainRoute.vue'
import { QUEUE_ID_UPLOAD_SLOTS } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { ACL, assetTypeAcl, useAuth } from '@/domains/system/auth/auth'

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
  removeFile: [fileId: DocId]
  makeMainFile: [fileId: DocId]
  unsetSlot: [data: { fileId: DocId; slotName: string }]
  duplicateSlot: [data: { fileId: DocId; targetSlotName: string }]
  switchSlot: [data: { sourceSlotName: string; targetSlotName: string }]
  refreshList: []
}>()

const { t } = useI18n()
// Off for an asset being deleted.
const assetDetailStore = useAssetDetailStore()
const uploadQueuesStore = useUploadQueuesStore()
const { can, canForAll } = useAuth()

const canUpdateAssetAndFile = computed(() => canForAll([ACL.DAM_ASSET_UPDATE, assetTypeAcl(props.assetType, 'update')]))

const itemHasFile = computed(() => {
  return props.item && props.item.assetFile
})

const fileTitle = computed(() => {
  if (!props.item || !props.item.assetFile) return ''
  return props.item.assetFile.fileAttributes.originFileName
    ? props.item.assetFile.fileAttributes.originFileName
    : props.item.assetFile.id
})

// Item and index together, from one lookup, so they cannot drift apart: the row is rendered with
// the index and the progress from the item, and both have to mean the same upload.
const uploadQueueItemInAnyProgress = computed(() => {
  const found = uploadQueuesStore.getQueueItemForSlotItem(QUEUE_ID_UPLOAD_SLOTS, props.slotName, props.assetId)
  if (found && found.item.status !== UploadQueueItemStatus.Uploaded) return found
  return undefined
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

const { copy, isSupported: clipboardCopyIsSupported } = useClipboard()
const { showSuccess, showErrorsDefault, showUnknownError } = useAlerts()

/* The address of the file is read anew at each press, and is signed for a while. The tab is opened at the press, as a
 * browser can drop one opened after the request without a word, and has no way back to this page. */
// While the address is asked for, a second press opens no second tab and asks nothing.
const downloadFile = async () => {
  if (!props.item || !props.item.assetFile) return
  const fileId = props.item.assetFile.id
  if (downloadsOnTheirWay.has(fileId)) return
  const tab = openTabForAddress()
  if (!tab.opened) return
  downloadsOnTheirWay.add(fileId)
  try {
    const res = await fileDownloadLink(props.assetType, fileId)
    tab.show(res.link)
  } catch (e) {
    tab.close()
    // Why the server refused it; anything else as an unknown error.
    if (!showErrorsDefault(e)) showUnknownError()
  } finally {
    downloadsOnTheirWay.delete(fileId)
  }
}

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
  uploadQueuesStore.stopItemUpload(data.queueId, data.item)
}
</script>

<template>
  <div class="pa-4 pb-8 text-body-medium">
    <VRow v-if="uploadQueueItemInAnyProgress">
      <VCol>
        <div class="font-weight-bold">
          {{ slotName }}
        </div>
        <div class="dam-upload-queue dam-upload-queue--list w-100 h-100 d-block">
          <AssetQueueItemList
            :key="uploadQueueItemInAnyProgress.item.key"
            :index="uploadQueueItemInAnyProgress.index"
            :item="uploadQueueItemInAnyProgress.item"
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
            <ADamAssetFileFailReasonChip
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
          :is-main-file="item.main"
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
          :disabled="assetDetailStore.isDeleting"
        />
        <VBtn
          v-if="itemHasFile"
          :aria-label="t('coreDam.asset.slots.actions.slotOptions')"
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
                <!-- Only a processed file: the server would take any, and the asset would be left with a main file
                     that has no picture, or one it still waits for. -->
                <VListItem
                  v-if="
                    totalSlotCount > 1 &&
                    item &&
                    !item.main &&
                    canUpdateAssetAndFile &&
                    statusComputed === AssetFileProcessStatus.Processed
                  "
                  :title="t('coreDam.asset.slots.actions.makeMainFile')"
                  :disabled="assetDetailStore.isDeleting"
                  @click.stop="makeMainFile"
                />
                <AssetSlotListItemDuplicate
                  v-if="totalSlotCount > 1 && canUpdateAssetAndFile"
                  :item="item"
                  :file-title="fileTitle"
                  @duplicate-slot="duplicateSlot"
                />
                <AssetSlotListItemSwitch
                  v-if="totalSlotCount > 1 && can(ACL.DAM_ASSET_UPDATE)"
                  :item="item"
                  :file-title="fileTitle"
                  @switch-slot="switchSlot"
                />
                <AssetSlotListItemRemove
                  :item="item"
                  :asset-type="assetType"
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
