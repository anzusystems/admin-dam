<script lang="ts" setup>
import { useRoute, useRouter } from 'vue-router'
import { nextTick, onMounted, ref } from 'vue'
import { type DocId, isDocId, isString, useAlerts, useDamCachedUsers, useTheme } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { storeToRefs } from 'pinia'
import AssetImageRoiSelect from '@/views/coreDam/asset/detail/components/AssetImageRoiSelect.vue'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import AssetDetailDialogSidebar from '@/views/coreDam/asset/detail/components/AssetDetailDialogSidebar.vue'
import { fetchAsset } from '@/services/api/coreDam/assetApi'
import { useI18n } from 'vue-i18n'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'
import { ROUTE } from '@/router/routes'
import { useAssetDetailActions } from '@/views/coreDam/asset/detail/composables/assetDetailActions'

defineEmits<{
  (e: 'mainRouteChanged'): void
}>()

const { t } = useI18n()
const { showErrorT } = useAlerts()
const route = useRoute()
const router = useRouter()
const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const { asset } = storeToRefs(assetDetailStore)
const { toolbarColor } = useTheme()
const { activeTab } = useAssetDetailTab()
const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()
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
    addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
    fetchCachedUsers()
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
  addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
  fetchCachedUsers()
  assetDetailStore.hideLoader()
}

const resetAllStores = () => {
  assetDetailStore.hideDetail()
  assetDetailStore.reset()
  activeTab.value = AssetDetailTab.Default
  assetDetailStore.directDetailLoad = false
  assetListStore.reset()
}

onMounted(() => {
  resetAllStores()
  setTimeout(() => {
    getDetail()
  }, 100)
})
</script>

<template>
  <div
    v-if="assetDetailStore.loader"
    class="d-flex w-100 h-100 justify-center align-center"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>
  <div v-else-if="asset">
    <VCard
      class="dam-image-detail"
      :class="{ 'dam-image-detail--sidebar-active': sidebar }"
    >
      <div class="dam-image-detail__wrapper d-flex flex-column">
        <VToolbar
          :color="toolbarColor"
          density="compact"
          :height="64"
          class="system-border-b pr-1"
        >
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
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.detail.toggleInfo') }}
              </VTooltip>
            </VBtn>
            <VBtn
              icon
              variant="text"
              :width="36"
              :height="36"
              class="mr-1"
              @click.stop="closeDialog"
            >
              <VIcon icon="mdi-close" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('common.button.close') }}
              </VTooltip>
            </VBtn>
          </div>
        </VToolbar>
        <div class="d-flex w-100 h-100 position-relative">
          <div class="d-flex w-100 align-center dam-image-detail__left">
            <div
              v-if="activeTab === AssetDetailTab.ROI"
              class="w-100 h-100 pa-2 d-flex align-center justify-center"
            >
              <AssetImageRoiSelect />
            </div>
            <div
              v-else
              class="w-100 h-100 pa-2 d-flex align-center justify-center"
            >
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
              :asset-main-file-fail-reason="assetMainFile ? assetMainFile.fileAttributes.failReason : undefined"
              @post-delete="closeDialog"
              @main-route-changed="getDetail"
            />
          </div>
        </div>
      </div>
    </VCard>
  </div>
</template>
