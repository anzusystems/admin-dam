<script lang="ts" setup>
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { AActionDeleteButton, AssetFileProcessStatus, cloneDeep, isNull, useAlerts } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { showMetadataSaveError, updateAssetMetadata } from '@/domains/coreDam/asset/api/assetApi'
import AssetMetadata from '@/domains/coreDam/asset/components/AssetMetadata.vue'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDownloadButton from '@/domains/coreDam/asset/components/detail/components/AssetDownloadButton.vue'
import { useAssetDeleted } from '@/domains/coreDam/asset/components/detail/composables/assetDeleted'
import { useAssetDetailActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailActions'
import { assetDeleteOnItsWay, deleteAssetOnce } from '@/domains/coreDam/asset/composables/assetDeleteOnce'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { metadataMayStillChange, useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { ACL } from '@/domains/system/auth/auth'

withDefaults(
  defineProps<{
    isActive: boolean
    dataCy?: string
    assetType: DamAssetTypeType
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{ postDelete: [data: DocId] }>()

const { t } = useI18n()

const {
  asset,
  metadataAreTouched,
  mainFileSingleUse,
  mainFileOverrideInternal,
  mainFileInternal,
  ttsAudio,
  saveHeldBack,
} = useAssetDetailActions()
const assetDetailStore = useAssetDetailStore()
const uploadQueueStore = useUploadQueuesStore()

const saveButtonLoading = ref(false)
/* Saved before the server has processed the file, the form would overwrite what it fills in from the file. Also once
 * the asset got another main file under what was typed: the form is still the one read before that. */
const saveBlocked = computed(() => !isNull(asset.value) && (saveHeldBack.value || metadataMayStillChange(asset.value)))
/* Held back for a main file that failed or is processed, nothing is left to be processed: the asset read whole - opened
 * again, once what was typed is left - frees "Save". The line under it says which. */
const heldBackLine = computed(() => {
  switch (asset.value?.mainFile?.fileAttributes.status) {
    case AssetFileProcessStatus.Failed:
      return 'coreDam.asset.detail.fileFailedOpenAgain'
    case AssetFileProcessStatus.Processed:
      return 'coreDam.asset.detail.fileProcessedOpenAgain'
    default:
      return 'coreDam.asset.detail.fileStillProcessing'
  }
})

// An asset being deleted - by this detail, by the bin of a queue row, elsewhere - has nothing to be saved into, nor to
// be deleted.
const isDeleting = computed(() => assetDetailStore.isDeleting)

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })

/* The button only spins while a save is on its way, so another can start, as in the panel beside the list. What a save
 * takes of what was typed, and what it leaves unsaved when it fails, the store keeps for both (`saveSent`). */
const onSave = async () => {
  if (isNull(asset.value)) return
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  // What this save sends, taken as it starts: another asset can be opened, or this one typed into, while it is on the
  // wire. The switch is the detail's own, not the value the asset was opened with.
  const saved = { ...cloneDeep(asset.value), mainFileSingleUse: mainFileSingleUse.value }
  /* Before the request, not after it: what is typed while it is on the wire is not in it. Known to a read of the asset
   * that nobody here started too: its answer can be from before this save. */
  const saveAnswered = assetDetailStore.saveSent(asset.value)
  let failed = false
  try {
    await updateAssetMetadata(
      saved,
      mainFileSingleUse.value,
      mainFileOverrideInternal.value,
      mainFileInternal.value,
      ttsAudio.value
    )
    // Into a row of the asset in a queue too, wherever this detail was opened from: a later bulk save sends that row.
    uploadQueueStore.updateAssetMetadata(saved)
    showRecordWas('updated')
  } catch (error) {
    failed = true
    showMetadataSaveError(error)
  } finally {
    saveAnswered(failed)
    saveButtonLoading.value = false
  }
}

const assetDeleted = useAssetDeleted()

/* The asset deleted is the one the delete was sent for: by its answer the detail can hold the next one, or this part
 * of it be gone with its tab. The page is told by its function; the event closes the dialog over the list, and only
 * while that is still drawn. One delete of the asset at a time, as the bin of a queue row. Its rows go from the queues
 * on every page the detail is drawn on: the upload queue outlives the page. */
const onDelete = async () => {
  if (isNull(asset.value)) return
  const assetId = asset.value.id
  try {
    if (!(await deleteAssetOnce(assetId))) return
    showRecordWas('deleted')
    uploadQueueStore.removeRowsOfDeletedAsset(assetId)
    assetDeleted(assetId)
    emit('postDelete', assetId)
  } catch (error) {
    showErrorsDefault(error)
  }
}
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <AssetDownloadButton :asset-type="assetType" />
    <Acl :permission="ACL.DAM_ASSET_DELETE">
      <AActionDeleteButton
        :disabled="isDeleting || assetDeleteOnItsWay(asset?.id)"
        @delete-record="onDelete"
      />
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_UPDATE">
      <ABtnPrimary
        type="submit"
        class="ml-2"
        data-cy="button-save"
        :variant="metadataAreTouched ? 'flat' : 'text'"
        :loading="saveButtonLoading"
        :disabled="saveBlocked || isDeleting"
        @click.stop="onSave"
      >
        {{ t('common.button.save') }}
      </ABtnPrimary>
    </Acl>
  </AssetDetailSidebarActionsWrapper>
  <!-- In the sidebar, not in the bar of the actions above: that one has a fixed height. -->
  <!-- Not for an asset being deleted: "Save" is off for that, and neither line would come true. -->
  <Acl :permission="ACL.DAM_ASSET_UPDATE">
    <div
      v-if="isActive && saveBlocked && !isDeleting"
      class="text-body-small px-4 pt-2"
    >
      {{ t(heldBackLine) }}
    </div>
  </Acl>
  <AssetMetadata />
</template>
