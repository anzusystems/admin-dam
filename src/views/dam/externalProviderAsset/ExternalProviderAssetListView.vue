<script lang="ts" setup>
import { onMounted } from 'vue'
import { useExternalProviderAssetListActions } from '@/views/dam/externalProviderAsset/composables/externalProviderAssetListActions'
import { useGridView } from '@/composables/system/gridView'
import { useI18n } from 'vue-i18n'
import ExternalProviderAssetListItem from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetListItem.vue'
import ExternalProviderAssetDetailDialog from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetDetailDialog.vue'
import MainWrapper from '@/components/wrappers/MainWrapper.vue'
import DGridViewToggle from '@/components/system/DGridViewToggle.vue'
import AssetUpload from '@/views/dam/asset/components/AssetUpload.vue'
import ExternalProviderAssetToolbarSearch from '@/views/dam/asset/components/toolbar/ExternalProviderAssetToolbarSearch.vue'
import ExternalProviderAssetListSidebarFilter from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetListSidebarFilter.vue'
import ExternalProviderAssetListSidebarMetadata from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetListSidebarMetadata.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import AssetFooterUploadOverlayFull from '@/views/dam/asset/components/footer/AssetFooterUploadOverlayFull.vue'
import { FooterViewUpload, useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import ExternalProviderAssetFooterSelected from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetFooterSelected.vue'
import ExternalProviderAssetFooterSelectedFull from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetFooterSelectedFull.vue'
import {
  ExternalProviderFooterViewSelected,
  useExternalProviderAssetFooterSelectedView,
} from '@/composables/system/externalProviderAssetFooterSelected'
import { onKeyUp } from '@vueuse/core'

const { t } = useI18n({ useScope: 'global' })

const { sidebarRight } = useMainWrapper()

const loadOnScroll = true

const { gridView } = useGridView()

const {
  loader,
  items,
  pagination,
  fetchNextPage,
  listMounted,
  showDetail,
  onItemClick,
  toggleSelected,
  selectMultiple,
  prevItem,
  nextItem,
  totalCountText,
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
</script>

<template>
  <MainWrapper>
    <template #default>
      <div class="d-flex w-100 h-100 align-center justify-center" v-if="loader.hard">
        <VProgressCircular indeterminate color="primary"></VProgressCircular>
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
          ></ExternalProviderAssetListItem>
          <div v-if="loader.soft" class="w-100 d-flex align-center justify-center pa-4">
            <VProgressCircular indeterminate color="primary"></VProgressCircular>
          </div>
          <div class="w-100" v-if="loadOnScroll" v-intersect="autoloadOnIntersect"></div>
        </div>
        <ExternalProviderAssetDetailDialog @prev-item="prevItem" @next-item="nextItem" />
      </div>
      <div class="text-h6 text-medium-emphasis d-flex w-100 h-100 align-center justify-center" v-else>
        {{ t('coreDam.asset.noItemsFound') }}
      </div>
    </template>
    <template #main-bar-left>
      <ExternalProviderAssetToolbarSearch />
      <AssetUpload variant="button" :button-text="t('system.mainBar.upload')" />
    </template>
    <template #second-bar-right>
      <div class="text-caption">Found items: {{ totalCountText }}</div>
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
