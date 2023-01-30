<script lang="ts" setup>
import { useAssetDetailActions } from '@/views/dam/asset/detail/composables/assetDetailActions'
import { deleteAsset, updateAssetMetadata } from '@/services/api/dam/assetApi'
import { isNull } from '@/utils/common'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { useUiHelper } from '@/composables/system/uiHelper'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import AssetMetadata from '@/views/dam/asset/components/AssetMetadata.vue'
import useVuelidate from '@vuelidate/core'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import ADeleteButton from '@/components/common/buttons/action/ADeleteButton.vue'
import AssetDownloadButton from '@/views/dam/asset/detail/components/AssetDownloadButton.vue'
import { AssetType } from '@/model/dam/valueObject/AssetType'

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

const { t } = useI18n({ useScope: 'global' })

const { asset } = useAssetDetailActions()

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()
const { btn, btnReset, btnLoadingOn, btnDisable, btnEnable } = useUiHelper()

const v$ = useVuelidate({}, {}, { $scope: AssetMetadataValidationScopeSymbol })

const onSave = async () => {
  if (isNull(asset.value)) return
  btnDisable('save')
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    btnEnable('save')
    return
  }
  try {
    btnLoadingOn('save')
    await updateAssetMetadata(asset.value)
    showRecordWas('updated')
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('save')
  }
}

const onDelete = async () => {
  if (isNull(asset.value)) return
  try {
    await deleteAsset(asset.value.id)
    showRecordWas('deleted')
    emit('postDelete', asset.value.id)
  } catch (error) {
    handleError(error)
  }
}
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <AssetDownloadButton :asset-type="assetType" />
    <ADeleteButton @delete-record="onDelete" />
    <VBtn
      color="success"
      type="submit"
      @click.stop="onSave"
      variant="flat"
      class="ml-2"
      :loading="btn.save.loading"
      :disabled="btn.save.disabled"
    >
      {{ t('common.button.save') }}
    </VBtn>
  </AssetDetailSidebarActionsWrapper>
  <AssetMetadata />
</template>
