<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { nextTick, onMounted, ref } from 'vue'
import { type DocId, isDocId, isString, useAlerts, useTheme } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { storeToRefs } from 'pinia'
import AssetImageRoiSelect from '@/views/dam/asset/detail/components/AssetImageRoiSelect.vue'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'
import AssetDetailDialogSidebar from '@/views/dam/asset/detail/components/AssetDetailDialogSidebar.vue'
import { fetchAsset } from '@/services/api/dam/assetApi'
import { loadLazyUser } from '@/views/dam/user/composables/lazyUser'
import { useI18n } from 'vue-i18n'
import { useAssetListStore } from '@/stores/dam/assetListStore'
import { ROUTE } from '@/router/routes'
import { useAssetDetailActions } from '@/views/dam/asset/detail/composables/assetDetailActions'

const { t } = useI18n()
const { showErrorT } = useAlerts()
const route = useRoute()
const router = useRouter()
const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const { asset } = storeToRefs(assetDetailStore)
const { toolbarColor } = useTheme()
const { activeTab } = useAssetDetailTab()
const { fetchLazyUser, addToLazyUserBuffer } = loadLazyUser()
const {
  toggleSidebar,
  sidebar,
  assetType,
  assetStatus,
  isTypeImage,
  isTypeVideo,
  isTypeAudio,
  isTypeDocument,
  imageProperties,
  assetMainFile,
  toolbarTitle,
} = useAssetDetailActions()

const id = ref<DocId>('')

const closeDialog = () => {
  assetListStore.keyboardNavigationEnable()
  assetDetailStore.hideDetail()
  router.push({ name: ROUTE.DAM.ASSET.LIST })
}

const onImageLoad = () => {
  // imageLoading.value = false
}

const getDetail = async () => {
  if (assetDetailStore.directDetailLoad) {
    assetDetailStore.setView('list')
    assetDetailStore.showDetail()
    if (assetDetailStore.asset?.createdBy) {
      addToLazyUserBuffer(assetDetailStore.asset.createdBy)
    }
    if (assetDetailStore.asset?.modifiedBy) {
      addToLazyUserBuffer(assetDetailStore.asset.modifiedBy)
    }
    fetchLazyUser()
    nextTick(() => {
      assetDetailStore.directDetailLoad = false
    })
    return
  }
  id.value = isString(route.params.id) && isDocId(route.params.id) ? route.params.id.toString() : ''
  if (id.value.length === 0) {
    showErrorT('coreDam.asset.detail.incorrectId')
    return
  }
  assetDetailStore.setView('list')
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  const res = await fetchAsset(id.value)
  assetDetailStore.setAsset(res)
  if (assetDetailStore.asset?.createdBy) {
    addToLazyUserBuffer(assetDetailStore.asset.createdBy)
  }
  if (assetDetailStore.asset?.modifiedBy) {
    addToLazyUserBuffer(assetDetailStore.asset.modifiedBy)
  }
  fetchLazyUser()
  assetDetailStore.hideLoader()
}

onMounted(() => {
  getDetail()
})
</script>

<template>
  <div v-if="assetDetailStore.loader" class="d-flex w-100 h-100 justify-center align-center">
    <VProgressCircular indeterminate color="primary" />
  </div>
  <div v-else-if="asset">
    <VCard class="dam-image-detail" :class="{ 'dam-image-detail--sidebar-active': sidebar }">
      <div class="dam-image-detail__wrapper d-flex flex-column">
        <VToolbar :color="toolbarColor" density="compact" :height="64" class="system-border-b">
          <div class="text-subtitle-2 d-flex pl-2">
            <div>{{ toolbarTitle }}</div>
          </div>
          <VSpacer />
          <div>
            <VBtn
              :active="sidebar"
              :variant="sidebar ? 'flat' : 'text'"
              :color="sidebar ? 'secondary' : ''"
              icon
              class="mr-1"
              :width="36"
              :height="36"
              @click.stop="toggleSidebar"
            >
              <VIcon icon="mdi-information-outline" />
              <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.detail.toggleInfo') }}</VTooltip>
            </VBtn>
            <VBtn icon variant="text" :width="36" :height="36" class="mr-1" @click.stop="closeDialog">
              <VIcon icon="mdi-close" />
              <VTooltip activator="parent" location="bottom">{{ t('common.button.close') }}</VTooltip>
            </VBtn>
          </div>
        </VToolbar>
        <div class="d-flex w-100 h-100 position-relative">
          <div class="d-flex w-100 align-center dam-image-detail__left">
            <div v-if="activeTab === AssetDetailTab.ROI" class="w-100 h-100 pa-2 d-flex align-center justify-center">
              <AssetImageRoiSelect />
            </div>
            <div v-else class="w-100 h-100 pa-2 d-flex align-center justify-center">
              <AssetImage
                :asset-type="assetType"
                :asset-status="assetStatus"
                :src="imageProperties.url"
                :background-color="imageProperties.bgColor"
                :width="imageProperties.width"
                :height="imageProperties.height"
                use-component
                @load="onImageLoad"
                @error="onImageLoad"
              />
            </div>
          </div>
          <div class="h-100 d-flex dam-image-detail__sidebar system-border-l">
            <AssetDetailDialogSidebar
              v-if="asset"
              :asset-id="asset.id"
              :is-video="isTypeVideo"
              :is-audio="isTypeAudio"
              :is-image="isTypeImage"
              :is-document="isTypeDocument"
              :asset-status="assetStatus"
              :asset-type="assetType"
              :asset-main-file-status="assetMainFile ? assetMainFile.fileAttributes.status : undefined"
              @post-delete="closeDialog"
            />
          </div>
        </div>
      </div>
    </VCard>
  </div>
</template>
