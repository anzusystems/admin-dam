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
import { useAssetDetailActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailActions'
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
  (e: 'mainRouteChanged'): void
}>()

const { t } = useI18n()

const { asset, mainFileSingleUse, mainFileOverrideInternal, mainFileInternal, ttsAudio } = useAssetDetailActions()
const uploadQueueStore = useUploadQueuesStore()

const saveButtonLoading = ref(false)
// Saved before the server has processed the file, the form would overwrite what it fills in from the file.
const saveBlocked = computed(() => !isNull(asset.value) && metadataMayStillChange(asset.value))

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })

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
    showMetadataSaveError(error)
  } finally {
    saveButtonLoading.value = false
  }
}

const onDelete = async () => {
  if (isNull(asset.value)) return
  try {
    await deleteAsset(asset.value.id)
    showRecordWas('deleted')
    emit('postDelete', asset.value.id)
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
  <AssetMetadata @main-route-changed="emit('mainRouteChanged')" />
</template>
