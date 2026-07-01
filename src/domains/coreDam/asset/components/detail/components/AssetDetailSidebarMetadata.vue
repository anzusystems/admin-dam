<script lang="ts" setup>
import { AssetMetadataValidationScopeSymbol } from '@/domains/coreDam/shared/validationScopes'
import { ACL } from '@/domains/system/auth/auth'
import { deleteAsset, updateAssetMetadata } from '@/domains/coreDam/asset/api/assetApi'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import AssetMetadata from '@/domains/coreDam/asset/components/AssetMetadata.vue'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDownloadButton from '@/domains/coreDam/asset/components/detail/components/AssetDownloadButton.vue'
import { useAssetDetailActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailActions'
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { AActionDeleteButton } from '@anzusystems/common-admin'

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

const { asset, view, mainFileSingleUse, mainFileOverrideInternal, mainFileInternal, ttsAudio } = useAssetDetailActions()
const uploadQueueStore = useUploadQueuesStore()

const saveButtonLoading = ref(false)

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
  try {
    await updateAssetMetadata(
      asset.value,
      mainFileSingleUse.value,
      mainFileOverrideInternal.value,
      mainFileInternal.value,
      ttsAudio.value
    )
    if (view.value === 'queue') {
      uploadQueueStore.updateAssetMetadata(asset.value)
    }
    showRecordWas('updated')
  } catch (error) {
    showErrorsDefault(error)
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
        @click.stop="onSave"
      >
        {{ t('common.button.save') }}
      </ABtnPrimary>
    </Acl>
  </AssetDetailSidebarActionsWrapper>
  <AssetMetadata @main-route-changed="emit('mainRouteChanged')" />
</template>
