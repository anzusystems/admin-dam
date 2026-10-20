<script lang="ts" setup>
import type { DatatableOrderingOption } from '@anzusystems/common-admin'
import { ADatatableOrdering, AUnsavedConfirmDialog, DatatablePaginationKey } from '@anzusystems/common-admin'
import { onKeyUp, useEventListener } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, onUnmounted, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import AssetUpload from '@/domains/coreDam/asset/components/AssetUpload.vue'
import AssetDetailDialog from '@/domains/coreDam/asset/components/detail/components/AssetDetailDialog.vue'
import { provideAssetDeleted } from '@/domains/coreDam/asset/components/detail/composables/assetDeleted'
import { provideAssetFileChanged } from '@/domains/coreDam/asset/components/detail/composables/assetDetailFileChange'
import AssetFooterSelected from '@/domains/coreDam/asset/components/footer/AssetFooterSelected.vue'
import AssetFooterSelectedFull from '@/domains/coreDam/asset/components/footer/AssetFooterSelectedFull.vue'
import AssetFooterUploadOverlayFull from '@/domains/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue'
import AssetListSidebarFilter from '@/domains/coreDam/asset/components/list/components/AssetListSidebarFilter.vue'
import AssetListSidebarMetadata from '@/domains/coreDam/asset/components/list/components/AssetListSidebarMetadata.vue'
import AssetListTableView from '@/domains/coreDam/asset/components/list/components/AssetListTableView.vue'
import AssetListTilesView from '@/domains/coreDam/asset/components/list/components/AssetListTilesView.vue'
import {
  customSortOptions,
  useAssetListActions,
} from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import AssetToolbarSearch from '@/domains/coreDam/asset/components/toolbar/AssetToolbarSearch.vue'
import AssetToolbarTypeFilters from '@/domains/coreDam/asset/components/toolbar/AssetToolbarTypeFilters.vue'
import { FooterViewSelected, useAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/assetFooterSelected'
import { FooterViewUpload, useAssetFooterUploadView } from '@/domains/coreDam/asset/composables/assetFooterUpload'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import GridViewToggle from '@/domains/system/components/GridViewToggle.vue'
import MainWrapper from '@/domains/system/components/MainWrapper.vue'
import { GridView, useGridView } from '@/domains/system/composables/gridView'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'

const { t } = useI18n()

const loadOnScroll = true

const { gridView } = useGridView()
const { sidebarRight } = useMainWrapper()
const assetDetailStore = useAssetDetailStore()
const assetListStore = useAssetListStore()
/* Before the first render, not once mounted: the detail is drawn with the page, and another page can have left one
 * open in the store - the page of the detail of an asset, left by the back button of the browser. */
assetDetailStore.reset()

const {
  loader,
  items,
  pagination,
  fetchAssetList,
  fetchNextPage,
  listMounted,
  listUnmounted,
  prevItem,
  nextItem,
  onArrowRight,
  onArrowLeft,
  refreshActiveItem,
} = useAssetListActions(sidebarRight)

provide(DatatablePaginationKey, pagination)
/* The detail and the panel beside the list tell of a change of the file of their asset: it is read again. Not here
 * once the page is left, which the answer of the change can outlast: the asset the detail holds by then is the next
 * page's to read, and that page is told, as the server tells it. Left, not being left: while the page asks whether to
 * leave what was typed, it is still there. */
let pageLeft = false
onBeforeUnmount(() => {
  pageLeft = true
})
provideAssetFileChanged((byServer) => {
  if (pageLeft) assetDetailStore.tellPageOfFileChange()
  else refreshActiveItem(byServer)
})
/* And of an asset deleted in the detail: its tile is marked as being deleted, and so is the asset where the detail or
 * the panel holds it still - the one deleted, not the one the detail has gone on to meanwhile. */
provideAssetDeleted((assetId) => {
  assetListStore.setDeletingById(assetId)
  if (assetDetailStore.asset?.id === assetId) assetDetailStore.setDeleting()
})

const { footerViewSelected } = useAssetFooterSelectedView()
const { footerViewUpload } = useAssetFooterUploadView()

const autoloadOnIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && pagination.value.hasNextPage === true) {
    fetchNextPage()
  }
}

onKeyUp('ArrowRight', async (e) => {
  await onArrowRight(e)
})

onKeyUp('ArrowLeft', async (e) => {
  await onArrowLeft(e)
})

/* Metadata typed into the detail or into the panel beside the list and not saved go with the page: asked about
 * before it is left. The address of an open detail is written over the address of this page, which is no way out of
 * it and is not asked about. */
const holdsUnsavedMetadata = () => assetDetailStore.showsUnsavedMetadata || assetDetailStore.panelHoldsUnsavedMetadata

/* Asked as the last thing before a navigation is settled, not as the page's leave guard, which is the first: a
 * guard after that one can still call the navigation off. Vuetify has such a guard for every dialog and menu - the
 * back button of the browser over an open one only closes it - and that is then no way out of the page. */
const router = useRouter()
const pageOfTheList = useRoute().matched.at(-1)
const stopAskingOnTheWayOut = router.beforeResolve((to) => {
  // Another query or hash of the list is the same page still.
  if (to.matched.some((record) => record === pageOfTheList)) return true

  return !holdsUnsavedMetadata() || assetDetailStore.askToLeaveUnsaved()
})
onUnmounted(stopAskingOnTheWayOut)

/* A reload and a closed window are not ways the page could ask about: the browser asks its own question. The
 * download of a file from the detail is none of them: its link opens in another tab. */
useEventListener(window, 'beforeunload', (event) => {
  if (!holdsUnsavedMetadata()) return
  event.preventDefault()
  // Older browsers ask only when this is set.
  event.returnValue = ''
})

onMounted(async () => {
  await listMounted()
})

const componentComputed = computed(() => {
  switch (gridView.value) {
    case GridView.Table:
      return AssetListTableView
    case GridView.Masonry:
    case GridView.Thumbnail:
    default:
      return AssetListTilesView
  }
})

const sortByChange = (data: DatatableOrderingOption) => {
  if (data.sortBy) {
    pagination.value.sortBy = data.sortBy
    fetchAssetList()
  }
}

onUnmounted(() => {
  listUnmounted()
})
</script>

<template>
  <MainWrapper>
    <template #default>
      <div
        id="asset-active-filters"
        class="asset-active-filters"
      />
      <div
        v-if="loader.hard"
        class="d-flex w-100 h-100 align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>
      <div v-else-if="items.length">
        <div>
          <component :is="componentComputed" />
          <div
            v-if="loader.soft"
            class="w-100 d-flex align-center justify-center pa-4"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </div>
          <div
            v-if="loadOnScroll"
            v-intersect="autoloadOnIntersect"
            class="w-100"
          />
        </div>
      </div>
      <div
        v-else
        class="text-headline-small text-medium-emphasis d-flex w-100 h-100 align-center justify-center"
      >
        {{ t('coreDam.asset.noItemsFound') }}
      </div>
      <!-- Not of the rows: the detail is also of an asset the list does not hold, and stays while the list is read. -->
      <AssetDetailDialog
        @prev-item="prevItem"
        @next-item="nextItem"
      />
      <!-- Of the panel beside the list: with the detail open the question is the detail's, a dialog over it. -->
      <AUnsavedConfirmDialog
        :model-value="assetDetailStore.leaveUnsavedQuestion && !assetDetailStore.detail"
        @resolve="assetDetailStore.answerLeaveUnsaved"
      />
    </template>
    <template #main-bar-middle>
      <AssetToolbarSearch />
    </template>
    <template #main-bar-right>
      <AssetUpload
        variant="button"
        :button-text="t('system.mainBar.upload')"
      />
    </template>
    <template #second-bar-left>
      <VDivider
        vertical
        class="ml-1 mr-2 my-2"
      />
      <AssetToolbarTypeFilters />
    </template>
    <template #second-bar-right>
      <VBtn
        :aria-label="t('coreDam.asset.list.refresh')"
        variant="text"
        icon
        size="x-small"
        class="ml-1"
        @click.stop="fetchAssetList"
      >
        <VIcon icon="mdi-refresh" />
        <VTooltip
          activator="parent"
          location="bottom"
        >
          {{ t('coreDam.asset.list.refresh') }}
        </VTooltip>
      </VBtn>
      <VDivider
        vertical
        class="mx-1 my-2 hidden-xs"
      />
      <ADatatableOrdering
        :custom-options="customSortOptions"
        @sort-by-change="sortByChange"
      />
      <VDivider
        vertical
        class="mx-1 my-2 hidden-xs"
      />
      <GridViewToggle class="hidden-xs" />
      <VDivider
        vertical
        class="mx-1 my-2"
      />
    </template>
    <template #sidebar-left>
      <AssetListSidebarFilter />
    </template>
    <template #sidebar-right>
      <AssetListSidebarMetadata />
    </template>
    <template #custom-footer>
      <AssetFooterSelected />
    </template>
    <template #custom-dialog>
      <div class="asset-footer d-flex flex-column justify-space-between w-100 h-100">
        <AssetFooterSelectedFull v-if="footerViewSelected === FooterViewSelected.Full" />
        <AssetFooterUploadOverlayFull v-else-if="footerViewUpload === FooterViewUpload.Full" />
      </div>
    </template>
  </MainWrapper>
</template>

<style lang="scss">
// Active-filter chips for the asset grid. AFiltersSelected is rendered inside the filter sidebar
// (where the selected-filters map + provides live) and teleported here, under the toolbar.
.asset-active-filters {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  overflow-x: auto;
  padding: 6px 8px;
  border-bottom: 1px solid rgb(var(--v-border-color), var(--v-border-opacity));

  &:empty {
    display: none;
  }
}
</style>
