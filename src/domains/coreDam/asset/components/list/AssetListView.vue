<script lang="ts" setup>
import { GridView, useGridView } from '@/domains/system/composables/gridView'
import AssetDetailDialog from '@/domains/coreDam/asset/components/detail/components/AssetDetailDialog.vue'
import {
  customSortOptions,
  useAssetListActions,
} from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import MainWrapper from '@/domains/system/components/MainWrapper.vue'
import AssetToolbarTypeFilters from '@/domains/coreDam/asset/components/toolbar/AssetToolbarTypeFilters.vue'
import GridViewToggle from '@/domains/system/components/GridViewToggle.vue'
import AssetToolbarSearch from '@/domains/coreDam/asset/components/toolbar/AssetToolbarSearch.vue'
import AssetUpload from '@/domains/coreDam/asset/components/AssetUpload.vue'
import AssetListSidebarFilter from '@/domains/coreDam/asset/components/list/components/AssetListSidebarFilter.vue'
import AssetListSidebarMetadata from '@/domains/coreDam/asset/components/list/components/AssetListSidebarMetadata.vue'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import AssetFooterSelected from '@/domains/coreDam/asset/components/footer/AssetFooterSelected.vue'
import AssetFooterSelectedFull from '@/domains/coreDam/asset/components/footer/AssetFooterSelectedFull.vue'
import AssetFooterUploadOverlayFull from '@/domains/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue'
import { FooterViewSelected, useAssetFooterSelectedView } from '@/domains/coreDam/asset/composables/assetFooterSelected'
import { FooterViewUpload, useAssetFooterUploadView } from '@/domains/coreDam/asset/composables/assetFooterUpload'
import { onKeyUp } from '@vueuse/core'
import AssetListTableView from '@/domains/coreDam/asset/components/list/components/AssetListTableView.vue'
import AssetListTilesView from '@/domains/coreDam/asset/components/list/components/AssetListTilesView.vue'
import type { DatatableOrderingOption } from '@anzusystems/common-admin'
import { ADatatableOrdering, DatatablePaginationKey } from '@anzusystems/common-admin/labs'

const { t } = useI18n()

const loadOnScroll = true

const { gridView } = useGridView()
const { sidebarRight } = useMainWrapper()

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
        <AssetDetailDialog
          @prev-item="prevItem"
          @next-item="nextItem"
          @main-route-changed="refreshActiveItem"
        />
      </div>
      <div
        v-else
        class="text-headline-small text-medium-emphasis d-flex w-100 h-100 align-center justify-center"
      >
        {{ t('coreDam.asset.noItemsFound') }}
      </div>
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
      <AssetListSidebarMetadata @main-route-changed="refreshActiveItem" />
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
