<script lang="ts" setup>
import { useExternalProviderAssetListActions } from '@/domains/coreDam/externalProvider/composables/externalProviderAssetListActions'
import { useGridView } from '@/domains/system/composables/gridView'
import ExternalProviderAssetListItem from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetListItem.vue'
import ExternalProviderAssetDetailDialog from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetDetailDialog.vue'
import MainWrapper from '@/domains/system/components/MainWrapper.vue'
import GridViewToggle from '@/domains/system/components/GridViewToggle.vue'
import AssetUpload from '@/domains/coreDam/asset/components/AssetUpload.vue'
import ExternalProviderAssetToolbarSearch from '@/domains/coreDam/asset/components/toolbar/ExternalProviderAssetToolbarSearch.vue'
import ExternalProviderAssetListSidebarFilter from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetListSidebarFilter.vue'
import ExternalProviderAssetListSidebarMetadata from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetListSidebarMetadata.vue'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import AssetFooterUploadOverlayFull from '@/domains/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue'
import { FooterViewUpload, useAssetFooterUploadView } from '@/domains/coreDam/asset/composables/assetFooterUpload'
import ExternalProviderAssetFooterSelected from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetFooterSelected.vue'
import ExternalProviderAssetFooterSelectedFull from '@/domains/coreDam/externalProvider/components/ExternalProviderAssetFooterSelectedFull.vue'
import {
  ExternalProviderFooterViewSelected,
  useExternalProviderAssetFooterSelectedView,
} from '@/domains/coreDam/asset/composables/externalProviderAssetFooterSelected'
import { FilterConfigKey, FilterDataKey } from '@anzusystems/common-admin/labs'
import { onKeyUp } from '@vueuse/core'

const { t } = useI18n()

const { sidebarRight } = useMainWrapper()

const loadOnScroll = true

const { gridView } = useGridView()

const {
  loader,
  items,
  pagination,
  filterData,
  filterConfig,
  fetchAssetList,
  fetchNextPage,
  listMounted,
  listUnmounted,
  showDetail,
  onItemClick,
  toggleSelected,
  selectMultiple,
  prevItem,
  nextItem,
  onArrowRight,
  onArrowLeft,
} = useExternalProviderAssetListActions(sidebarRight)

provide(FilterConfigKey, filterConfig)
provide(FilterDataKey, filterData)

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

const { externalProviderFooterViewSelected } = useExternalProviderAssetFooterSelectedView()
const { footerViewUpload } = useAssetFooterUploadView()

onMounted(async () => {
  await listMounted()
})

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
        <div
          class="dam-image-grid"
          :class="'dam-image-grid--' + gridView"
        >
          <ExternalProviderAssetListItem
            v-for="(item, index) in items"
            :key="item.asset.id"
            :index="index"
            :item="item"
            @show-detail="showDetail"
            @item-click="onItemClick"
            @toggle-selected="toggleSelected"
            @select-multiple="selectMultiple"
          />
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
        <ExternalProviderAssetDetailDialog
          @prev-item="prevItem"
          @next-item="nextItem"
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
      <ExternalProviderAssetToolbarSearch />
    </template>
    <template #main-bar-right>
      <AssetUpload
        variant="button"
        :button-text="t('system.mainBar.upload')"
      />
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
      <GridViewToggle class="hidden-xs" />
      <VDivider
        vertical
        class="mx-1 my-2"
      />
    </template>
    <template #sidebar-left>
      <ExternalProviderAssetListSidebarFilter />
    </template>
    <template #sidebar-right>
      <ExternalProviderAssetListSidebarMetadata />
    </template>
    <template #custom-footer>
      <ExternalProviderAssetFooterSelected />
    </template>
    <template #custom-dialog>
      {{ externalProviderFooterViewSelected }}
      <div class="asset-footer d-flex flex-column justify-space-between w-100 h-100">
        <ExternalProviderAssetFooterSelectedFull
          v-if="externalProviderFooterViewSelected === ExternalProviderFooterViewSelected.Full"
        />
        <AssetFooterUploadOverlayFull v-else-if="footerViewUpload === FooterViewUpload.Full" />
      </div>
    </template>
  </MainWrapper>
</template>
