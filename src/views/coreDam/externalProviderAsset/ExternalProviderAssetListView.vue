<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue'
import {
  useExternalProviderAssetListActions
} from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetListActions'
import { useGridView } from '@/composables/system/gridView'
import { useI18n } from 'vue-i18n'
import ExternalProviderAssetListItem
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetListItem.vue'
import ExternalProviderAssetDetailDialog
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetDetailDialog.vue'
import MainWrapper from '@/components/wrappers/MainWrapper.vue'
import DGridViewToggle from '@/components/system/DGridViewToggle.vue'
import AssetUpload from '@/views/coreDam/asset/components/AssetUpload.vue'
import ExternalProviderAssetToolbarSearch
  from '@/views/coreDam/asset/components/toolbar/ExternalProviderAssetToolbarSearch.vue'
import ExternalProviderAssetListSidebarFilter
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetListSidebarFilter.vue'
import ExternalProviderAssetListSidebarMetadata
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetListSidebarMetadata.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import AssetFooterUploadOverlayFull from '@/views/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue'
import { FooterViewUpload, useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import ExternalProviderAssetFooterSelected
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetFooterSelected.vue'
import ExternalProviderAssetFooterSelectedFull
  from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetFooterSelectedFull.vue'
import {
  ExternalProviderFooterViewSelected,
  useExternalProviderAssetFooterSelectedView,
} from '@/composables/system/externalProviderAssetFooterSelected'
import { onKeyUp } from '@vueuse/core'

const { t } = useI18n()

const { sidebarRight } = useMainWrapper()

const loadOnScroll = true

const { gridView } = useGridView()

const {
  loader,
  items,
  pagination,
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

const autoloadOnIntersect = (isIntersecting: boolean) => {
  if (isIntersecting && pagination.hasNextPage === true) {
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
      <div v-if="loader.hard" class="d-flex w-100 h-100 align-center justify-center">
        <VProgressCircular indeterminate color="primary" />
      </div>
      <div v-else-if="items.length">
        <div class="dam-image-grid" :class="'dam-image-grid--' + gridView">
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
          <div v-if="loader.soft" class="w-100 d-flex align-center justify-center pa-4">
            <VProgressCircular indeterminate color="primary" />
          </div>
          <div v-if="loadOnScroll" v-intersect="autoloadOnIntersect" class="w-100" />
        </div>
        <ExternalProviderAssetDetailDialog @prev-item="prevItem" @next-item="nextItem" />
      </div>
      <div v-else class="text-h6 text-medium-emphasis d-flex w-100 h-100 align-center justify-center">
        {{ t('coreDam.asset.noItemsFound') }}
      </div>
    </template>
    <template #main-bar-left>
      <ExternalProviderAssetToolbarSearch />
      <AssetUpload variant="button" :button-text="t('system.mainBar.upload')" />
    </template>
    <template #second-bar-right>
      <VBtn variant="text" icon size="x-small" class="ml-1" @click.stop="fetchAssetList">
        <VIcon icon="mdi-refresh" />
        <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.list.refresh') }}</VTooltip>
      </VBtn>
      <VDivider vertical class="mx-1 my-2" />
      <DGridViewToggle />
      <VDivider vertical class="mx-1 my-2" />
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
