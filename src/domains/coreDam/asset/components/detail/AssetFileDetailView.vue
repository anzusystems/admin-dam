<script lang="ts" setup>
import {
  ADamAssetImage,
  ADamAssetImageRoiSelect,
  isDocId,
  isString,
  useAlerts,
  useDamCachedUsers,
  usePageNavigation,
  useTheme,
} from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { fetchAsset, fetchAssetByFileId } from '@/domains/coreDam/asset/api/assetApi'
import AssetDetailDialogSidebar from '@/domains/coreDam/asset/components/detail/components/AssetDetailDialogSidebar.vue'
import { provideAssetDeleted } from '@/domains/coreDam/asset/components/detail/composables/assetDeleted'
import { useAssetDetailActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailActions'
import {
  provideAssetFileChanged,
  useAssetDetailFileChange,
} from '@/domains/coreDam/asset/components/detail/composables/assetDetailFileChange'
import { useDetailInfoPanel } from '@/domains/coreDam/asset/components/detail/composables/detailInfoPanel'
import {
  AssetDetailTab,
  AssetDetailTabDefault,
  useAssetDetailTab,
} from '@/domains/coreDam/asset/composables/assetDetailTab'
import { useCurrentAssetLicence, useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { ACL, useAuth } from '@/domains/system/auth/auth'

const { t } = useI18n()
const { showErrorT, showErrorsDefault, showWarningT } = useAlerts()
// A failure that ends after the user navigated away is not shown.
const { onPage } = usePageNavigation()
const route = useRoute()
const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
const { asset } = storeToRefs(assetDetailStore)
const { toolbarColor } = useTheme()
const { activeTab } = useAssetDetailTab()
const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { readAfterFileChange } = useAssetDetailFileChange()
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
const { wide, panelId } = useDetailInfoPanel()

const assetFileId = ref<DocId>('')

// The asset reported deleted by the detail's event. The page is emptied of it.
let emptiedOf: DocId | null = null

const afterDelete = (deletedId: DocId) => {
  emptiedOf = deletedId
  asset.value = null
}

// Reads the full asset behind the detail loader.
const readAsset = async (read: () => ReturnType<typeof fetchAsset>) => {
  assetDetailStore.setView('list')
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  // Counted with every other fetch that writes to this store.
  const detailRequest = assetDetailStore.startDetailRequest()
  try {
    const res = await read()
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    if (currentAssetLicenceId.value !== res.licence) {
      if (onPage()) showErrorT('coreDam.asset.detail.licenceMismatch')
      assetDetailStore.hideLoader()
      return
    }
    assetDetailStore.setAsset(res, detailRequest)
    addToCachedUsers(assetDetailStore.asset?.createdBy, assetDetailStore.asset?.modifiedBy)
    fetchCachedUsers()
  } catch (error) {
    if (!assetDetailStore.isCurrentDetailRequest(detailRequest)) return
    /*
     * Cleared like the list's detail. On a re-read after a file change,
     * the old asset would otherwise stay under a working "Save".
     * The first read has nothing to clear.
     */
    assetDetailStore.reset()
    if (!onPage()) return
    showErrorsDefault(error)
  } finally {
    if (assetDetailStore.isCurrentDetailRequest(detailRequest)) assetDetailStore.hideLoader()
  }
}

const getDetail = async () => {
  const rawId = (route.params as { id: string }).id
  assetFileId.value = isString(rawId) && isDocId(rawId) ? rawId.toString() : ''
  if (assetFileId.value.length === 0) {
    showErrorT('coreDam.asset.detail.incorrectId')
    return
  }
  await readAsset(() => fetchAssetByFileId(assetFileId.value))
}

/*
 * Re-reads the asset by its own id after its file changed. The file
 * in the page address may be the deleted one and no longer exist.
 * Skipped once the page is left, which the change response can outlast.
 */
provideAssetFileChanged((byServer) => {
  if (!onPage()) return
  readAfterFileChange(async () => {
    const held = assetDetailStore.asset
    if (held) await readAsset(() => fetchAsset(held.id))
  }, byServer)
})

/*
 * Marks the deleted asset as deleting while the page holds it, so editing is disabled.
 * This also covers a delete answered after another tab opened, when the deleting part is gone and sends no event.
 * If its event arrives, it comes right after and empties the
 * page. Otherwise the page stays and shows the asset was deleted.
 */
provideAssetDeleted((deletedId) => {
  if (assetDetailStore.asset?.id !== deletedId) return
  assetDetailStore.setDeleting()
  queueMicrotask(() => {
    if (emptiedOf === deletedId || !onPage()) return
    showWarningT('coreDam.asset.detail.deletedMeanwhile')
  })
})

const resetAllStores = () => {
  assetDetailStore.hideDetail()
  assetDetailStore.reset()
  activeTab.value = AssetDetailTabDefault
  assetListStore.reset()
}

const { currentExtSystemId } = useCurrentExtSystem()
const { can } = useAuth()

// The first read is delayed. It is cancelled when the page is left first, or it would read for the next page.
let firstRead: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  resetAllStores()
  firstRead = setTimeout(() => {
    getDetail()
  }, 100)
})

onUnmounted(() => {
  clearTimeout(firstRead)
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
          class="border-b pr-1"
        >
          <div class="text-label-large d-flex pl-2">
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
              :asset-id="asset.id"
              :is-video="isTypeVideo"
              :is-audio="isTypeAudio"
              :is-image="isTypeImage"
              :is-document="isTypeDocument"
              :asset-status="assetStatus"
              :asset-type="assetType"
              :asset-main-file-status="assetMainFile ? assetMainFile.fileAttributes.status : undefined"
              :asset-main-file-fail-reason="assetMainFile ? assetMainFile.fileAttributes.failReason : undefined"
              @post-delete="afterDelete"
            />
          </div>
        </div>
      </div>
    </VCard>
  </div>
</template>
