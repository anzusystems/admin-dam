<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue'
import { useGridView } from '@/composables/system/gridView'
import AssetDetailDialog from '@/views/dam/asset/detail/components/AssetDetailDialog.vue'
import AssetListItem from '@/views/dam/asset/list/components/AssetListItem.vue'
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'
import MainWrapper from '@/components/wrappers/MainWrapper.vue'
import AssetToolbarTypeFilters from '@/views/dam/asset/components/toolbar/AssetToolbarTypeFilters.vue'
import DGridViewToggle from '@/components/system/DGridViewToggle.vue'
import AssetToolbarSearch from '@/views/dam/asset/components/toolbar/AssetToolbarSearch.vue'
import AssetUpload from '@/views/dam/asset/components/AssetUpload.vue'
import AssetListSidebarFilter from '@/views/dam/asset/list/components/AssetListSidebarFilter.vue'
import AssetListSidebarMetadata from '@/views/dam/asset/list/components/AssetListSidebarMetadata.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import AssetFooterSelected from '@/views/dam/asset/components/footer/AssetFooterSelected.vue'
import AssetFooterSelectedFull from '@/views/dam/asset/components/footer/AssetFooterSelectedFull.vue'
import AssetFooterUploadOverlayFull from '@/views/dam/asset/components/footer/AssetFooterUploadOverlayFull.vue'
import { FooterViewSelected, useAssetFooterSelectedView } from '@/composables/system/assetFooterSelected'
import { FooterViewUpload, useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import { onKeyUp } from '@vueuse/core'

const { t } = useI18n({ useScope: 'global' })

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
  showDetail,
  onItemClick,
  toggleSelected,
  selectMultiple,
  prevItem,
  nextItem,
  onArrowRight,
  onArrowLeft,
  showMetaIcons,
  toggleShowMetaIcons,
} = useAssetListActions(sidebarRight)

const { footerViewSelected } = useAssetFooterSelectedView()
const { footerViewUpload } = useAssetFooterUploadView()

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
          <AssetListItem
            v-for="(item, index) in items"
            :key="item.asset.id"
            :index="index"
            :item="item"
            :show-meta-icons="showMetaIcons"
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
        <AssetDetailDialog @prev-item="prevItem" @next-item="nextItem" />
      </div>
      <div v-else class="text-h6 text-medium-emphasis d-flex w-100 h-100 align-center justify-center">
        {{ t('coreDam.asset.noItemsFound') }}
      </div>
    </template>
    <template #main-bar-left>
      <AssetToolbarSearch />
      <AssetUpload variant="button" :button-text="t('system.mainBar.upload')" />
    </template>
    <template #second-bar-left>
      <VDivider vertical class="ml-1 mr-2 my-2" />
      <AssetToolbarTypeFilters />
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
