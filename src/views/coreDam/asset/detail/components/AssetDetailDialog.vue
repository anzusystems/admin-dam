<script setup lang="ts">
import { computed, ref } from 'vue'
import AssetDetailDialogSidebar from '@/views/coreDam/asset/detail/components/AssetDetailDialogSidebar.vue'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { storeToRefs } from 'pinia'
import AssetDetailDialogLoader from '@/views/coreDam/asset/detail/components/AssetDetailDialogLoader.vue'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'
import { AssetDetailTab, useAssetDetailTab } from '@/composables/system/assetDetailTab'
import AssetImageRoiSelect from '@/views/coreDam/asset/detail/components/AssetImageRoiSelect.vue'
import type { DocId } from '@anzusystems/common-admin'
import {
  assetFileIsImageFile,
  browserHistoryReplaceUrlByRouter,
  DamAssetStatus,
  DamAssetType,
  isNull,
  useTheme,
} from '@anzusystems/common-admin'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ROUTE } from '@/router/routes'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'nextItem'): void
  (e: 'prevItem'): void
  (e: 'mainRouteChanged'): void
}>()

const { toolbarColor } = useTheme()
const router = useRouter()

const { activeTab } = useAssetDetailTab()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const { pagination } = useAssetListActions() // todo
const { asset } = storeToRefs(assetDetailStore)

const closeDialog = () => {
  assetListStore.keyboardNavigationEnable()
  assetDetailStore.hideDetail()
  browserHistoryReplaceUrlByRouter(router, { name: ROUTE.DAM.ASSET.LIST })
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
  return asset.value?.attributes.assetType || DamAssetType.Default
})

const assetStatus = computed(() => {
  if (!asset.value) return DamAssetStatus.Default
  return asset.value.attributes.assetStatus
})

const isTypeImage = computed(() => {
  return assetType.value === DamAssetType.Image
})
const isTypeVideo = computed(() => {
  return assetType.value === DamAssetType.Video
})
const isTypeAudio = computed(() => {
  return assetType.value === DamAssetType.Audio
})
const isTypeDocument = computed(() => {
  return assetType.value === DamAssetType.Document
})

const imageProperties = computed(() => {
  if (asset.value?.mainFile && asset.value.mainFile.links) {
    if (asset.value.mainFile.links.image_animated) {
      return {
        url: asset.value.mainFile.links.image_animated.url,
        width: asset.value.mainFile.links.image_animated.width,
        height: asset.value.mainFile.links.image_animated.height,
        bgColor:
          assetFileIsImageFile(asset.value.mainFile) &&
          asset.value.mainFile.imageAttributes &&
          asset.value.mainFile.imageAttributes.mostDominantColor
            ? asset.value.mainFile.imageAttributes.mostDominantColor
            : '#ccc',
      }
    }
    if (asset.value.mainFile.links.image_detail) {
      return {
        url: asset.value.mainFile.links.image_detail.url,
        width: asset.value.mainFile.links.image_detail.width,
        height: asset.value.mainFile.links.image_detail.height,
        bgColor:
          assetFileIsImageFile(asset.value.mainFile) &&
          asset.value.mainFile.imageAttributes &&
          asset.value.mainFile.imageAttributes.mostDominantColor
            ? asset.value.mainFile.imageAttributes.mostDominantColor
            : '#ccc',
      }
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
  <VDialog
    v-model="assetDetailStore.detail"
    fullscreen
  >
    <AssetDetailDialogLoader
      v-if="assetDetailStore.loader"
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
          class="system-border-b pr-1"
        >
          <div v-if="assetDetailStore.view === 'list'">
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
          <div
            v-if="assetDetailStore.view === 'list'"
            class="text-subtitle-2 d-flex"
          >
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
              :key="asset.id"
              :asset-id="asset.id"
              :is-video="isTypeVideo"
              :is-audio="isTypeAudio"
              :is-image="isTypeImage"
              :is-document="isTypeDocument"
              :asset-status="assetStatus"
              :asset-type="assetType"
              :asset-main-file-status="assetMainFile ? assetMainFile.fileAttributes.status : undefined"
              :asset-main-file-fail-reason="assetMainFile ? assetMainFile.fileAttributes.failReason : undefined"
              @post-delete="postDelete"
              @main-route-changed="$emit('mainRouteChanged')"
            />
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>
