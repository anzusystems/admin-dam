<script lang="ts" setup>
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import { ACL } from '@/composables/auth/auth'
import { deleteAsset, updateAssetMetadata } from '@/services/api/coreDam/assetApi'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import AssetMetadata from '@/views/coreDam/asset/components/AssetMetadata.vue'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDownloadButton from '@/views/coreDam/asset/detail/components/AssetDownloadButton.vue'
import { useAssetDetailActions } from '@/views/coreDam/asset/detail/composables/assetDetailActions'
import type { DamAssetTypeType, DocId } from '@anzusystems/common-admin'
import { AActionDeleteButton, isNull, useAlerts } from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

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

const { asset, view } = useAssetDetailActions()
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
    await updateAssetMetadata(asset.value)
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
