<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useAssetDetailActions } from '@/views/coreDam/asset/detail/composables/assetDetailActions'
import { updateAssetMetadata } from '@/services/api/coreDam/assetApi'
import { browserHistoryReplaceUrlByRouter, isNull, useAlerts, useErrorHandler } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { useI18n } from 'vue-i18n'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import AssetMetadata from '@/views/coreDam/asset/components/AssetMetadata.vue'
import AssetInfobox from '@/views/coreDam/asset/components/AssetInfobox.vue'
import useVuelidate from '@vuelidate/core'
import { AssetMetadataValidationScopeSymbol } from '@/components/validationScopes'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'
import { ACL } from '@/types/Permission'
import { useCachedUsers } from '@/views/coreDam/user/composables/cachedUsers'

const { sidebarRight } = useMainWrapper()
const router = useRouter()

const saveButtonLoading = ref(false)

const { t } = useI18n()

const { asset, loader, metadataUnTouch, metadataAreTouched } = useAssetDetailActions()

const { fetchCachedUsers, addToCachedUsers } = useCachedUsers()

const assetDetailStore = useAssetDetailStore()

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()

const onEditMore = async () => {
  assetDetailStore.showDetail()
  if (!assetDetailStore.asset) return
  browserHistoryReplaceUrlByRouter(router, { name: ROUTE.DAM.ASSET.DETAIL, params: { id: assetDetailStore.asset.id } })
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
      if (newValue.createdBy) addToCachedUsers(newValue.createdBy)
      if (newValue.modifiedBy) addToCachedUsers(newValue.modifiedBy)
      fetchCachedUsers()
    }
  },
  { immediate: true }
)
</script>

<template>
  <VNavigationDrawer v-model="sidebarRight" permanent location="right" :width="300">
    <div v-if="loader" class="d-flex w-100 h-100 align-center justify-center">
      <VProgressCircular indeterminate color="primary" />
    </div>
    <div v-else-if="!asset" class="d-flex w-100 h-100 align-center justify-center">
      {{ t('coreDam.asset.detail.noAssetSelected') }}
    </div>
    <div v-else>
      <AssetInfobox
        :asset-status="assetStatus"
        :asset-main-file-status="assetMainFile ? assetMainFile.fileAttributes.status : undefined"
        :asset-main-file-fail-reason="assetMainFile ? assetMainFile.fileAttributes.failReason : undefined"
      />
      <AssetMetadata />
    </div>
    <template v-if="!loader && asset" #append>
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn color="secondary" variant="flat" class="mr-2" size="small" @click.stop="onEditMore">
          {{ t('coreDam.asset.detail.info.edit') }}
        </VBtn>
        <Acl :permission="ACL.DAM_ASSET_UPDATE">
          <VBtn
            :color="metadataAreTouched ? 'success' : 'secondary'"
            size="small"
            variant="flat"
            :loading="saveButtonLoading"
            @click.stop="onSave"
          >
            {{ t('common.button.save') }}
          </VBtn>
        </Acl>
      </div>
    </template>
  </VNavigationDrawer>
</template>
