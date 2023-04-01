<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import AssetDetailDialogLoader from '@/views/coreDam/asset/detail/components/AssetDetailDialogLoader.vue'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import AssetImageRoiSelect from '@/views/coreDam/asset/detail/components/AssetImageRoiSelect.vue'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import { isNull, useTheme } from '@anzusystems/common-admin'
import { useExternalProviderAssetDetailStore } from '@/stores/coreDam/externalProviderAssetDetailStore'
import { useExternalProviderAssetListStore } from '@/stores/coreDam/externalProviderAssetListStore'
import ExternalProviderAssetDetailDialogSidebar from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetDetailDialogSidebar.vue'
import { useExternalProviderAssetListActions } from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetListActions'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  (e: 'nextItem'): void
  (e: 'prevItem'): void
}>()

const { t } = useI18n()

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
  if (isNull(externalProviderAssetListStore.activeItemIndex)) return ''
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
  <VDialog
    v-model="externalProviderAssetDetailStore.detail"
    fullscreen
    persistent
    no-click-animation
  >
    <AssetDetailDialogLoader
      v-if="externalProviderAssetDetailStore.loader"
      @close-dialog="closeDialog"
    />
    <VCard
      v-else-if="asset"
      class="dam-image-detail"
      :class="{ 'dam-image-detail--sidebar-active': sidebar }"
    >
      <div class="dam-image-detail__wrapper d-flex flex-column">
        <VToolbar
          :color="toolbarColor"
          density="compact"
          :height="64"
          class="system-border-b"
        >
          <div>
            <VBtn
              variant="text"
              icon
              class="mx-1"
              :width="36"
              :height="36"
              @click.stop="prevItem"
            >
              <VIcon icon="mdi-chevron-left" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.list.prev') }}
              </VTooltip>
            </VBtn>
            <VBtn
              variant="text"
              icon
              class="mr-2"
              :width="36"
              :height="36"
              @click.stop="nextItem"
            >
              <VIcon icon="mdi-chevron-right" />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.list.next') }}
              </VTooltip>
            </VBtn>
          </div>
          <div class="text-subtitle-2 d-flex">
            <div class="pr-4">
              {{ totalCountText }}
            </div>
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
              <div
                v-if="imageLoading && isTypeImage"
                class="d-flex w-100 h-100 align-center justify-center"
              >
                <VProgressCircular
                  indeterminate
                  color="white"
                />
              </div>
              <AssetImage
                :src="imageSrc"
                use-component
                @load="onImageLoad"
                @error="onImageLoad"
              />
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
