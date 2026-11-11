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
/*
 * "Save" is blocked while the server may still fill metadata from
 * the file, or after the main file changed under what was typed.
 * Saving then would overwrite what the server fills in, because the form is older.
 */
const saveBlocked = computed(() => !isNull(asset.value) && (saveHeldBack.value || metadataMayStillChange(asset.value)))
/*
 * Held back for a main file that is processed or failed: reading the asset whole frees "Save".
 * That happens when the asset is opened again or nothing typed is left. The line below says which case applies.
 */
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

// An asset being deleted, from here, a queue row or elsewhere, cannot be saved or deleted again.
const isDeleting = computed(() => assetDetailStore.isDeleting)

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })

/*
 * The button spins only while a save is in flight, so another save can start, as in the side panel.
 * The store tracks what each save took and what stays unsaved on failure (`saveSent`).
 */
const onSave = async () => {
  if (isNull(asset.value)) return
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  // Snapshot taken at start: another asset can be opened, or this one edited, while the save is in flight.
  // `mainFileSingleUse` is the detail's own switch, not the value the asset was opened with.
  const saved = { ...cloneDeep(asset.value), mainFileSingleUse: mainFileSingleUse.value }
  /*
   * Called before the request so edits made during it are not counted as sent.
   * Other asset reads also see it, since their answer can predate this save.
   */
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
    // Also update the asset's queue row: a later bulk save sends that row.
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

/*
 * Uses the asset the delete was sent for, since the detail can
 * hold the next asset or this tab can be gone by the answer.
 * The page is told through its provided function. The event closes the list dialog only while it is still drawn.
 * One delete per asset at a time, as with the queue row bin.
 * Rows are removed from the queues on every page, because the upload queue outlives the page.
 */
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
  <!-- In the sidebar, not the actions bar above, because that bar has a fixed height. -->
  <!-- Hidden for an asset being deleted: "Save" is off, so neither line applies. -->
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
