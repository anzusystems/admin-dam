<script setup lang="ts">
import {
  ADialogToolbar,
  DamAssetType,
  isUndefined,
  useDamAcceptTypeAndSizeHelper,
  useDamConfigState,
} from '@anzusystems/common-admin'
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import FileUpload from '@/domains/coreDam/shared/components/FileUpload.vue'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/domains/coreDam/shared/services/upload/uploadQueueIds'
import { ACL, assetTypeAcl, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { useBetaTestFeatures } from '@/shared/utils/BetaTestFeaturesService'

const props = withDefaults(
  defineProps<{
    variant?: 'dropzone-fullscreen' | 'button' | 'icon' | 'slot-upload'
    type?: 'default' | 'slots'
    buttonText?: string
    height?: number
    queueId?: string
    assetId?: DocId
    slotName?: string
    multiple?: boolean
    assetType?: DamAssetTypeType
  }>(),
  {
    variant: 'dropzone-fullscreen',
    type: 'default',
    buttonText: '',
    height: undefined,
    queueId: QUEUE_ID_UPLOAD_GLOBAL,
    assetId: undefined,
    slotName: undefined,
    multiple: true,
    assetType: undefined,
  }
)

const fileCache = ref<File[]>([])
const uploadDialog = ref(false)
const uploadDialogLoader = ref(false)

const uploadQueuesStore = useUploadQueuesStore()
const { maxUploadItems } = useBetaTestFeatures()

const assetUpload = async (files: File[]) => {
  fileCache.value = files
  if (files.length + uploadQueueTotalCount.value > maxUploadItems.value) {
    openDialog()
    return
  }
  if (props.type === 'slots' && props.assetId && props.slotName && props.assetType) {
    // todo add check by type for slot uploads
    await uploadQueuesStore.addByFilesAsSlotUpload(props.queueId, files, props.assetId, props.slotName, props.assetType)
    fileCache.value = []
    return
  } else if (props.type === 'default') {
    await uploadQueuesStore.addByFiles(props.queueId, files)
    fileCache.value = []
    return
  }
  console.error('Unsupported upload setup.')
}

const fileInputKey = computed(() => {
  return uploadQueuesStore.getQueueFileInputKey(props.queueId)
})

const uploadQueueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(props.queueId)
})

const alreadyAtUploadLimit = computed(() => {
  return uploadQueueTotalCount.value === maxUploadItems.value
})

const openDialog = () => {
  uploadDialog.value = true
}

const onDialogCancel = () => {
  fileCache.value = []
  uploadQueuesStore.forceReloadFileInput(props.queueId)
  uploadDialog.value = false
}

const onDialogConfirm = async () => {
  uploadDialogLoader.value = true
  const files = fileCache.value.slice(0, maxUploadItems.value - uploadQueueTotalCount.value)
  await uploadQueuesStore.addByFiles(props.queueId, files)
  fileCache.value = []
  uploadDialogLoader.value = false
  uploadDialog.value = false
}

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { uploadSizes, uploadAccept } = useDamAcceptTypeAndSizeHelper(props.assetType, configExtSystem)

const { can, canForAll } = useAuth()

// TODO(BE): core-dam checks dam_video_update / dam_document_update on an upload's chunk and finish requests, where image
// and audio check _create; should be _create (ACL BE task 2.13). A slot upload of the two checks _update on its create too.
const canUpload = computed(() => {
  if (props.type === 'slots') {
    if (isUndefined(props.assetType)) return false
    if (props.assetType === DamAssetType.Video || props.assetType === DamAssetType.Document) {
      return can(assetTypeAcl(props.assetType, 'update'))
    }
    return can(assetTypeAcl(props.assetType, 'create'))
  }
  return (
    (configExtSystem.image?.enabled && can(ACL.DAM_IMAGE_CREATE)) ||
    (configExtSystem.audio?.enabled && can(ACL.DAM_AUDIO_CREATE)) ||
    (configExtSystem.video?.enabled && canForAll([ACL.DAM_VIDEO_CREATE, ACL.DAM_VIDEO_UPDATE])) ||
    (configExtSystem.document?.enabled && canForAll([ACL.DAM_DOCUMENT_CREATE, ACL.DAM_DOCUMENT_UPDATE])) ||
    false
  )
})

const { t } = useI18n()
</script>

<template>
  <FileUpload
    v-if="canUpload"
    :variant="variant"
    :button-text="buttonText"
    :height="height"
    :file-input-key="fileInputKey"
    :accept="uploadAccept"
    :max-sizes="uploadSizes"
    :multiple="multiple"
    @files-input="assetUpload"
  />
  <VDialog
    v-model="uploadDialog"
    :width="500"
  >
    <VCard
      v-if="uploadDialog"
      data-cy="delete-panel"
    >
      <ADialogToolbar @cancel="onDialogCancel">
        {{ t('system.upload.limits.uploadWarning') }}
      </ADialogToolbar>
      <VCardText>
        <p v-if="alreadyAtUploadLimit">
          {{ t('system.upload.limits.onUploadLimit', { limit: maxUploadItems }) }}
        </p>
        <p v-else>
          {{ t('system.upload.limits.addingOverLimit', { count: fileCache.length }) }}
          <span v-if="uploadQueueTotalCount > 0">{{
            t('system.upload.limits.countAlreadyInProgress', { count: uploadQueueTotalCount })
          }}</span>
          {{ t('system.upload.limits.onlyAllowedAtOnce', { count: maxUploadItems }) }}<br /><br />
          {{ t('system.upload.limits.cancelOrUploadFirst', { count: maxUploadItems - uploadQueueTotalCount }) }}
        </p>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary @click.stop="onDialogCancel">
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          v-if="!alreadyAtUploadLimit"
          :loading="uploadDialogLoader"
          @click.stop="onDialogConfirm"
        >
          {{ t('system.upload.limits.actionAddFirstItems', { count: maxUploadItems - uploadQueueTotalCount }) }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
