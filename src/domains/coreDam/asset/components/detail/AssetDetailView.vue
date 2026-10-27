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
import { useRoute, useRouter } from 'vue-router'

import { fetchAsset } from '@/domains/coreDam/asset/api/assetApi'
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
const route = useRoute()
const router = useRouter()
const { onPage } = usePageNavigation()
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

const assetId = ref<DocId>('')

const closeDialog = () => {
  assetListStore.keyboardNavigationEnable()
  assetDetailStore.hideDetail()
  router.push({ name: '/(coreDam)/assets' })
}

// The asset reported deleted by the detail's event. The page closes over it.
let closedOver: DocId | null = null

const onPostDelete = (deletedId: DocId) => {
  closedOver = deletedId
  if (!onPage()) return
  closeDialog()
}

const getDetail = async () => {
  const rawId = (route.params as { id: string }).id
  assetId.value = isString(rawId) && isDocId(rawId) ? rawId.toString() : ''
  if (assetId.value.length === 0) {
    showErrorT('coreDam.asset.detail.incorrectId')
    return
  }
  assetDetailStore.setView('list')
  assetDetailStore.showLoader()
  assetDetailStore.showDetail()
  // Counted together with the list's detail fetches because they all write to this store.
  const detailRequest = assetDetailStore.startDetailRequest(assetId.value)
  try {
    const res = await fetchAsset(assetId.value)
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

/*
 * Re-reads the asset after its file changed.
 * Skipped once the page is left, which the change response can outlast. The read depends on the page address.
 */
provideAssetFileChanged((byServer) => {
  if (onPage()) readAfterFileChange(getDetail, byServer)
})

/*
 * Marks the deleted asset as deleting while the page holds it, so editing is disabled.
 * This also covers a delete answered after another tab opened, when the deleting part is gone and sends no event.
 * If its event arrives, it comes right after and closes the page.
 * Otherwise the page stays and shows the asset was deleted.
 */
provideAssetDeleted((deletedId) => {
  if (assetDetailStore.asset?.id !== deletedId) return
  assetDetailStore.setDeleting()
  queueMicrotask(() => {
    if (closedOver === deletedId || !onPage()) return
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
              @post-delete="onPostDelete"
            />
          </div>
        </div>
      </div>
    </VCard>
  </div>
</template>
