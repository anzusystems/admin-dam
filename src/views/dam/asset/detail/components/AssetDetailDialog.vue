<script setup lang="ts">
import { computed, ref } from 'vue'
import AssetDetailDialogSidebar from '@/views/dam/asset/detail/components/AssetDetailDialogSidebar.vue'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { storeToRefs } from 'pinia'
import AssetDetailDialogLoader from '@/views/dam/asset/detail/components/AssetDetailDialogLoader.vue'
import { useAssetListStore } from '@/stores/dam/assetListStore'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import AssetImageRoiSelect from '@/views/dam/asset/detail/components/AssetImageRoiSelect.vue'
import { AssetType } from '@/model/dam/valueObject/AssetType'
import { isImageFile } from '@/types/dam/File'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'
import { useTheme } from '@/composables/system/themeSettings'
import type { DocId } from '@anzusystems/common-admin'
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'
import { isNull } from '@/utils/common'

const { t } = useI18n({ useScope: 'global' })

const emit = defineEmits<{
  (e: 'nextItem'): void
  (e: 'prevItem'): void
}>()

const { toolbarColor } = useTheme()

const { activeTab } = useAssetDetailTab()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const { pagination } = useAssetListActions() // todo
const { asset } = storeToRefs(assetDetailStore)

const closeDialog = () => {
  assetListStore.keyboardNavigationEnable()
  assetDetailStore.hideDetail()
}

const postDelete = (data: DocId) => {
  assetListStore.setDeletingById(data)
  if (asset.value?.id === data) {
    assetDetailStore.setDeleting()
  }
  closeDialog()
}

const sidebar = ref(true)

const toggleSidebar = () => {
  sidebar.value = !sidebar.value
}

const onImageLoad = () => {
  // imageLoading.value = false
}

const nextItem = () => {
  emit('nextItem')
}
const prevItem = () => {
  emit('prevItem')
}

const assetType = computed(() => {
  return asset.value?.attributes.assetType || AssetType.Default
})

const assetStatus = computed(() => {
  if (!asset.value) return AssetStatus.Default
  return asset.value.attributes.assetStatus
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

const imageProperties = computed(() => {
  if (asset.value?.mainFile && asset.value.mainFile.links && asset.value.mainFile.links.image_detail) {
    return {
      url: asset.value.mainFile.links.image_detail.url,
      width: asset.value.mainFile.links.image_detail.width,
      height: asset.value.mainFile.links.image_detail.height,
      bgColor:
        isImageFile(asset.value.mainFile) &&
        asset.value.mainFile.imageAttributes &&
        asset.value.mainFile.imageAttributes.mostDominantColor
          ? asset.value.mainFile.imageAttributes.mostDominantColor
          : '#ccc',
    }
  }
  return {
    url: '',
    width: 356,
    height: 200,
    bgColor: '#ccc',
  }
})
const toolbarTitle = computed(() => {
  if (!asset.value) return ''
  return asset.value.texts.displayTitle
})
const totalCountText = computed(() => {
  if (isNull(assetListStore.activeItemIndex)) return ''
  return assetListStore.activeItemIndex + 1 + ' / ' + assetListStore.list.length + (pagination.hasNextPage ? '+' : '')
})
const assetMainFile = computed(() => {
  return asset.value?.mainFile || undefined
})
</script>

<template>
  <VDialog v-model="assetDetailStore.detail" fullscreen persistent no-click-animation>
    <AssetDetailDialogLoader v-if="assetDetailStore.loader" @close-dialog="closeDialog" />
    <VCard class="dam-image-detail" :class="{ 'dam-image-detail--sidebar-active': sidebar }" v-else-if="asset">
      <div class="dam-image-detail__wrapper d-flex flex-column">
        <VToolbar :color="toolbarColor" density="compact" :height="64" class="system-border-b">
          <div v-if="assetDetailStore.view === 'list'">
            <VBtn variant="text" icon @click.stop="prevItem" class="mx-1" :width="36" :height="36">
              <VIcon icon="mdi-chevron-left" />
              <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.prev') }}</VTooltip>
            </VBtn>
            <VBtn variant="text" icon @click.stop="nextItem" class="mr-2" :width="36" :height="36">
              <VIcon icon="mdi-chevron-right" />
              <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.next') }}</VTooltip>
            </VBtn>
          </div>
          <div v-if="assetDetailStore.view === 'list'" class="text-subtitle-2 d-flex">
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
              <VIcon icon="mdi-information-outline" />
              <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.detail.toggleInfo') }}</VTooltip>
            </VBtn>
            <VBtn icon variant="text" @click.stop="closeDialog" :width="36" :height="36" class="mr-1">
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
                @load="onImageLoad"
                @error="onImageLoad"
                use-component
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
              @post-delete="postDelete"
            />
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>
