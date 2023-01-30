<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AssetDetailDialogLoader from '@/views/dam/asset/detail/components/AssetDetailDialogLoader.vue'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import AssetImageRoiSelect from '@/views/dam/asset/detail/components/AssetImageRoiSelect.vue'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'
import { useTheme } from '@/composables/system/themeSettings'
import { useExternalProviderAssetDetailStore } from '@/stores/dam/externalProviderAssetDetailStore'
import { useExternalProviderAssetListStore } from '@/stores/dam/externalProviderAssetListStore'
import ExternalProviderAssetDetailDialogSidebar from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetDetailDialogSidebar.vue'
import { useExternalProviderAssetListActions } from '@/views/dam/externalProviderAsset/composables/externalProviderAssetListActions'

const emit = defineEmits<{
  (e: 'nextItem'): void
  (e: 'prevItem'): void
}>()

const { toolbarColor } = useTheme()

const imageLoading = ref(true)
const { activeTab } = useAssetDetailTab()

const externalProviderAssetDetailStore = useExternalProviderAssetDetailStore()
const externalProviderAssetListStore = useExternalProviderAssetListStore()
const { pagination } = useExternalProviderAssetListActions() //todo
const { asset } = storeToRefs(externalProviderAssetDetailStore)

const closeDialog = () => {
  externalProviderAssetListStore.keyboardNavigationEnable()
  externalProviderAssetDetailStore.hideDetail()
  imageLoading.value = true
}

const sidebar = ref(true)

const toggleSidebar = () => {
  sidebar.value = !sidebar.value
}

const onImageLoad = () => {
  imageLoading.value = false
}

const nextItem = () => {
  emit('nextItem')
}
const prevItem = () => {
  emit('prevItem')
}

const assetType = computed(() => {
  return asset.value?.attributes.assetType
})

const isTypeImage = computed(() => {
  return assetType.value === AssetType.Image
})
const isTypeVideo = computed(() => {
  return assetType.value === AssetType.Video
})
const isTypeAudio = computed(() => {
  return assetType.value === AssetType.Audio
})
const isTypeDocument = computed(() => {
  return assetType.value === AssetType.Document
})
const imageSrc = computed(() => {
  if (asset.value?.url) {
    return asset.value.url
  }
  return placeholder16x9
})
const toolbarTitle = computed(() => {
  if (!asset.value) return ''
  return asset.value.texts.displayTitle
})
const totalCountText = computed(() => {
  if (!externalProviderAssetListStore.activeItemIndex) return ''
  return (
    externalProviderAssetListStore.activeItemIndex +
    1 +
    ' / ' +
    externalProviderAssetListStore.list.length +
    (pagination.hasNextPage ? '+' : '')
  )
})
</script>

<template>
  <VDialog v-model="externalProviderAssetDetailStore.detail" fullscreen persistent no-click-animation>
    <AssetDetailDialogLoader
      v-if="externalProviderAssetDetailStore.loader"
      @close-dialog="closeDialog"
    ></AssetDetailDialogLoader>
    <VCard class="dam-image-detail" :class="{ 'dam-image-detail--sidebar-active': sidebar }" v-else-if="asset">
      <div class="dam-image-detail__wrapper d-flex flex-column">
        <VToolbar :color="toolbarColor" density="compact" :height="64" class="system-border-b">
          <div>
            <VBtn icon variant="text" @click.stop="prevItem" class="mx-1" :width="36" :height="36">
              <VIcon icon="mdi-chevron-left"></VIcon>
            </VBtn>
            <VBtn icon variant="text" @click.stop="nextItem" class="mr-2" :width="36" :height="36">
              <VIcon icon="mdi-chevron-right"></VIcon>
            </VBtn>
          </div>
          <div class="text-subtitle-2 d-flex">
            <div class="pr-4">{{ totalCountText }}</div>
            <div>{{ toolbarTitle }}</div>
          </div>
          <VSpacer />
          <div>
            <VBtn
              :active="sidebar"
              :variant="sidebar ? 'flat' : 'text'"
              :color="sidebar ? 'secondary' : ''"
              icon
              @click.stop="toggleSidebar"
              class="mr-1"
              :width="36"
              :height="36"
            >
              <VIcon icon="mdi-information-outline"></VIcon>
            </VBtn>
            <VBtn icon variant="text" @click.stop="closeDialog" :width="36" :height="36" class="mr-1">
              <VIcon icon="mdi-close"></VIcon>
            </VBtn>
          </div>
        </VToolbar>
        <div class="d-flex w-100 h-100 position-relative">
          <div class="d-flex w-100 align-center dam-image-detail__left">
            <div v-if="activeTab === AssetDetailTab.ROI" class="w-100 h-100 pa-2 d-flex align-center justify-center">
              <AssetImageRoiSelect></AssetImageRoiSelect>
            </div>
            <div v-else class="w-100 h-100 pa-2 d-flex align-center justify-center">
              <div v-if="imageLoading && isTypeImage" class="d-flex w-100 h-100 align-center justify-center">
                <VProgressCircular indeterminate color="white"></VProgressCircular>
              </div>
              <AssetImage :src="imageSrc" @load="onImageLoad" @error="onImageLoad" use-component />
            </div>
          </div>
          <div class="h-100 d-flex dam-image-detail__sidebar system-border-l">
            <ExternalProviderAssetDetailDialogSidebar
              :is-video="isTypeVideo"
              :is-audio="isTypeAudio"
              :is-image="isTypeImage"
              :is-document="isTypeDocument"
            />
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>
