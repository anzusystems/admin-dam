<script setup lang="ts">
import {
  ADamAssetImage,
  ADamAssetImageRoiSelect,
  AUnsavedConfirmDialog,
  DamAssetStatusDefault,
  DamAssetType,
  DamAssetTypeDefault,
  assetFileIsImageFile,
  browserHistoryReplaceUrlByRouter,
  isNull,
  usePageNavigation,
  useTheme,
} from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import AssetDetailDialogLoader from '@/domains/coreDam/asset/components/detail/components/AssetDetailDialogLoader.vue'
import AssetDetailDialogSidebar from '@/domains/coreDam/asset/components/detail/components/AssetDetailDialogSidebar.vue'
import {
  provideAssetDeleted,
  useAssetDeleted,
} from '@/domains/coreDam/asset/components/detail/composables/assetDeleted'
import { useDetailInfoPanel } from '@/domains/coreDam/asset/components/detail/composables/detailInfoPanel'
import {
  ASSET_DETAIL_DIALOG_CLASS,
  useAssetListActions,
} from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import { AssetDetailTab, useAssetDetailTab } from '@/domains/coreDam/asset/composables/assetDetailTab'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { ACL, useAuth } from '@/domains/system/auth/auth'

const emit = defineEmits<{ nextItem: []; prevItem: [] }>()

const { t } = useI18n()

const { toolbarColor } = useTheme()
const router = useRouter()
const { onPage } = usePageNavigation()

const { activeTab } = useAssetDetailTab()

const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const { pagination, neighbourOfActive } = useAssetListActions()
const { asset } = storeToRefs(assetDetailStore)

const closeDialog = () => {
  assetListStore.keyboardNavigationEnable()
  assetDetailStore.hideDetail()
  browserHistoryReplaceUrlByRouter(router, { name: '/(coreDam)/assets' })
}

/*
 * The page tells the list and panel via `provideAssetDeleted`, and the dialog uses the same function.
 * The deleting part can be gone by the response (another tab), and Vue drops what it emits then.
 * The dialog closes only over the deleted asset, not one it moved to meanwhile, even while that one is still loading.
 */
const toldPage = useAssetDeleted()
provideAssetDeleted((deletedId: DocId) => {
  toldPage(deletedId)
  if (assetDetailStore.shownOrReadAssetId() !== deletedId || !onPage()) return
  closeDialog()
})

const sidebar = ref(true)
const { wide, panelId } = useDetailInfoPanel()

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

const assetType = computed(() => asset.value?.attributes.assetType || DamAssetTypeDefault)

const assetStatus = computed(() => {
  if (!asset.value) return DamAssetStatusDefault
  return asset.value.attributes.assetStatus
})

const isTypeImage = computed(() => assetType.value === DamAssetType.Image)
const isTypeVideo = computed(() => assetType.value === DamAssetType.Video)
const isTypeAudio = computed(() => assetType.value === DamAssetType.Audio)
const isTypeDocument = computed(() => assetType.value === DamAssetType.Document)

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
/*
 * Loader title is the name of the asset being read: the held one on a re-read,
 * or its tile's name when navigating the list. Never another asset's name.
 */
const loaderTitle = computed(() => {
  const read = assetDetailStore.shownOrReadAssetId()
  if (!read) return ''
  if (asset.value?.id === read) return toolbarTitle.value
  const tile = assetListStore.getActiveAsset()

  return tile?.asset.id === read ? tile.asset.texts.displayTitle : ''
})
const totalCountText = computed(() => {
  if (isNull(assetListStore.activeItemIndex)) return ''
  return (
    assetListStore.activeItemIndex + 1 + ' / ' + assetListStore.list.length + (pagination.value.hasNextPage ? '+' : '')
  )
})
const assetMainFile = computed(() => asset.value?.mainFile || undefined)

const { currentExtSystemId } = useCurrentExtSystem()
const { can } = useAuth()
</script>

<template>
  <VDialog
    v-model="assetDetailStore.detail"
    fullscreen
    :class="ASSET_DETAIL_DIALOG_CLASS"
  >
    <AUnsavedConfirmDialog
      :model-value="assetDetailStore.leaveUnsavedQuestion && assetDetailStore.detail"
      @resolve="assetDetailStore.answerLeaveUnsaved"
    />
    <!-- Mirrors the loaded detail bar below, as far as known while the asset loads. -->
    <AssetDetailDialogLoader
      v-if="assetDetailStore.loader"
      :walks-list="assetDetailStore.view === 'list'"
      :prev-disabled="!neighbourOfActive(-1)"
      :next-disabled="!neighbourOfActive(1)"
      :total-count-text="totalCountText"
      :title="loaderTitle"
      @prev-item="prevItem"
      @next-item="nextItem"
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
          class="border-b pr-1"
        >
          <div v-if="assetDetailStore.view === 'list'">
            <VBtn
              :aria-label="t('coreDam.asset.list.prev')"
              variant="text"
              icon
              class="mx-1"
              :width="36"
              :height="36"
              :disabled="!neighbourOfActive(-1)"
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
              :aria-label="t('coreDam.asset.list.next')"
              variant="text"
              icon
              class="mr-2"
              :width="36"
              :height="36"
              :disabled="!neighbourOfActive(1)"
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
          <!-- Name in every detail. List position only in a list detail. -->
          <div
            class="text-label-large d-flex"
            :class="{ 'pl-2': assetDetailStore.view !== 'list' }"
          >
            <div
              v-if="assetDetailStore.view === 'list'"
              class="pr-4"
            >
              {{ totalCountText }}
            </div>
            <div>{{ toolbarTitle }}</div>
          </div>
          <VSpacer />
          <div>
            <VBtn
              :aria-label="t('coreDam.asset.detail.toggleInfo')"
              :aria-expanded="wide ? sidebar : undefined"
              :aria-controls="wide ? panelId : undefined"
              :active="sidebar"
              :variant="sidebar ? 'flat' : 'text'"
              :color="sidebar ? 'secondary' : ''"
              icon
              class="mr-1"
              :width="36"
              :height="36"
              @click.stop="toggleSidebar"
            >
              <!--
                Below 840 px the button toggles the image above the panel,
                so it uses an image icon, as in the library's detail.
              -->
              <VIcon
                icon="mdi-information-outline"
                class="d-none d-md-flex"
              />
              <VIcon
                icon="mdi-image-outline"
                class="d-flex d-md-none"
              />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.detail.toggleInfo') }}
              </VTooltip>
            </VBtn>
            <VBtn
              :aria-label="t('common.button.close')"
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
        <div class="d-flex w-100 h-100 position-relative dam-image-detail__content">
          <div class="d-flex w-100 align-center dam-image-detail__left">
            <div
              v-if="activeTab === AssetDetailTab.ROI && can(ACL.DAM_REGION_OF_INTEREST_UPDATE)"
              class="w-100 h-100 pa-2 d-flex align-center justify-center"
            >
              <ADamAssetImageRoiSelect
                :ext-system="currentExtSystemId"
                :readonly="assetDetailStore.isDeleting"
              />
            </div>
            <div
              v-else
              class="w-100 h-100 pa-2 d-flex align-center justify-center"
            >
              <ADamAssetImage
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
          <div
            :id="panelId"
            class="h-100 d-flex dam-image-detail__sidebar border-s"
            :inert="wide && !sidebar"
          >
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
            />
          </div>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>
