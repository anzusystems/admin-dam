<script lang="ts" setup>
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { AActionDeleteButton, cloneDeep, isNull, useAlerts } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { deleteAsset, showMetadataSaveError, updateAssetMetadata } from '@/domains/coreDam/asset/api/assetApi'
import AssetMetadata from '@/domains/coreDam/asset/components/AssetMetadata.vue'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDownloadButton from '@/domains/coreDam/asset/components/detail/components/AssetDownloadButton.vue'
import { useAssetDeleted } from '@/domains/coreDam/asset/components/detail/composables/assetDeleted'
import { useAssetDetailActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailActions'
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
const emit = defineEmits<{
  (e: 'postDelete', data: DocId): void
}>()

const { t } = useI18n()

const {
  asset,
  metadataTouch,
  metadataUnTouch,
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

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })

/* The save of this detail that started last, as in the panel on the right of the list: the button only spins
 * meanwhile, so another can start. What is saved is no longer "touched", or leaving the asset would ask about it; a
 * save that fails puts "touched" back only while it is still that one, and one started while another of the same
 * asset is on the wire takes over the "touched" that one took off. */
let latestSave: { opened: object; touched: boolean; pending: boolean } | undefined

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
  const opened = asset.value
  const save = {
    opened,
    touched: metadataAreTouched.value || (!!latestSave?.pending && latestSave.opened === opened && latestSave.touched),
    pending: true,
  }
  latestSave = save
  // Known to a read of the asset that nobody here started: its answer can be from before this save.
  const saveAnswered = assetDetailStore.saveSent(opened.id)
  try {
    // Before the request, not after it: what is typed while it is on the wire is not in it.
    metadataUnTouch()
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
    // Nothing was saved, so the form is as unsaved as it was - unless the detail holds another asset by now, or this
    // one read again.
    if (save.touched && asset.value === opened && latestSave === save) metadataTouch()
    showMetadataSaveError(error)
  } finally {
    save.pending = false
    saveAnswered()
    saveButtonLoading.value = false
  }
}

const assetDeleted = useAssetDeleted()

/* The asset deleted is the one the delete was sent for: by its answer the detail can hold the next one, or this part
 * of it be gone with its tab. The page is told by its function; the event closes the dialog over the list, and only
 * while that is still drawn. */
const onDelete = async () => {
  if (isNull(asset.value)) return
  const assetId = asset.value.id
  try {
    await deleteAsset(assetId)
    showRecordWas('deleted')
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
      <AActionDeleteButton @delete-record="onDelete" />
    </Acl>
    <Acl :permission="ACL.DAM_ASSET_UPDATE">
      <ABtnPrimary
        type="submit"
        class="ml-2"
        data-cy="button-save"
        :loading="saveButtonLoading"
        :disabled="saveBlocked"
        @click.stop="onSave"
      >
        {{ t('common.button.save') }}
      </ABtnPrimary>
    </Acl>
  </AssetDetailSidebarActionsWrapper>
  <!-- In the sidebar, not in the bar of the actions above: that one has a fixed height. -->
  <Acl :permission="ACL.DAM_ASSET_UPDATE">
    <div
      v-if="isActive && saveBlocked"
      class="text-body-small px-4 pt-2"
    >
      {{ t('coreDam.asset.detail.fileStillProcessing') }}
    </div>
  </Acl>
  <AssetMetadata />
</template>
