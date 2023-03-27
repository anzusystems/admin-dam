<script lang="ts" setup>
import { useAssetDetailActions } from '@/views/coreDam/asset/detail/composables/assetDetailActions'
import { deleteAsset, updateAssetMetadata } from '@/services/api/coreDam/assetApi'
import type { DocId } from '@anzusystems/common-admin'
import { AActionDeleteButton, isNull, useAlerts } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import { useI18n } from 'vue-i18n'
import AssetMetadata from '@/views/coreDam/asset/components/AssetMetadata.vue'
import useVuelidate from '@vuelidate/core'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import AssetDownloadButton from '@/views/coreDam/asset/detail/components/AssetDownloadButton.vue'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { ref } from 'vue'
import { ACL } from '@/types/Permission'

withDefaults(
  defineProps<{
    isActive: boolean
    assetType: AssetType
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'postDelete', data: DocId): void
}>()

const { t } = useI18n()

const { asset } = useAssetDetailActions()

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
      <VBtn color="success" type="submit" variant="flat" class="ml-2" :loading="saveButtonLoading" @click.stop="onSave">
        {{ t('common.button.save') }}
      </VBtn>
    </Acl>
  </AssetDetailSidebarActionsWrapper>
  <AssetMetadata />
</template>
