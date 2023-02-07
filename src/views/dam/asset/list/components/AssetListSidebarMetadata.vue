<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useAssetDetailActions } from '@/views/dam/asset/detail/composables/assetDetailActions'
import { updateAssetMetadata } from '@/services/api/dam/assetApi'
import { isNull } from '@/utils/common'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { loadLazyUser } from '@/views/dam/user/composables/lazyUser'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { useI18n } from 'vue-i18n'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import AssetMetadata from '@/views/dam/asset/components/AssetMetadata.vue'
import AssetInfobox from '@/views/dam/asset/components/AssetInfobox.vue'
import useVuelidate from '@vuelidate/core'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'

const { sidebarRight } = useMainWrapper()

const saveButtonLoading = ref(false)

const { t } = useI18n({ useScope: 'global' })

const { asset, loader, metadataUnTouch, metadataAreTouched } = useAssetDetailActions()

const { fetchLazyUser, addToLazyUserBuffer } = loadLazyUser()

const assetDetailStore = useAssetDetailStore()

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()

const onEditMore = async () => {
  assetDetailStore.showDetail()
}

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
    metadataUnTouch()
    await updateAssetMetadata(asset.value)
    showRecordWas('updated')
  } catch (error) {
    handleError(error)
  } finally {
    saveButtonLoading.value = false
  }
}

const assetStatus = computed(() => {
  return asset.value?.attributes.assetStatus || AssetStatus.Draft
})

const assetMainFile = computed(() => {
  return asset.value?.mainFile || undefined
})

watch(
  asset,
  (newValue, oldValue) => {
    if (newValue !== oldValue && newValue !== null) {
      addToLazyUserBuffer(newValue.createdBy)
      addToLazyUserBuffer(newValue.modifiedBy)
      fetchLazyUser()
    }
  },
  { immediate: true }
)
</script>

<template>
  <VNavigationDrawer v-model="sidebarRight" permanent location="right" :width="300">
    <div class="d-flex w-100 h-100 align-center justify-center" v-if="loader">
      <VProgressCircular indeterminate color="primary"/>
    </div>
    <div class="d-flex w-100 h-100 align-center justify-center" v-else-if="!asset">
      {{ t('coreDam.asset.detail.noAssetSelected') }}
    </div>
    <div v-else>
      <AssetInfobox
        :asset-status="assetStatus"
        :asset-main-file-status="assetMainFile ? assetMainFile.fileAttributes.status : undefined"
      />
      <AssetMetadata />
    </div>
    <template v-slot:append v-if="!loader && asset">
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn color="secondary" variant="flat" @click.stop="onEditMore" class="mr-2" size="small">
          {{ t('coreDam.asset.detail.info.edit') }}
        </VBtn>
        <VBtn
          :color="metadataAreTouched ? 'success' : 'secondary'"
          @click.stop="onSave"
          size="small"
          variant="flat"
          :loading="saveButtonLoading"
        >
          {{ t('common.button.save') }}
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
