<script lang="ts" setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { GridView, useGridView } from '@/composables/system/gridView'
import AssetDetailDialog from '@/views/coreDam/asset/detail/components/AssetDetailDialog.vue'
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'
import MainWrapper from '@/components/wrappers/MainWrapper.vue'
import AssetToolbarTypeFilters from '@/views/coreDam/asset/components/toolbar/AssetToolbarTypeFilters.vue'
import GridViewToggle from '@/components/system/GridViewToggle.vue'
import AssetToolbarSearch from '@/views/coreDam/asset/components/toolbar/AssetToolbarSearch.vue'
import AssetUpload from '@/views/coreDam/asset/components/AssetUpload.vue'
import AssetListSidebarFilter from '@/views/coreDam/asset/list/components/AssetListSidebarFilter.vue'
import AssetListSidebarMetadata from '@/views/coreDam/asset/list/components/AssetListSidebarMetadata.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import AssetFooterSelected from '@/views/coreDam/asset/components/footer/AssetFooterSelected.vue'
import AssetFooterSelectedFull from '@/views/coreDam/asset/components/footer/AssetFooterSelectedFull.vue'
import AssetFooterUploadOverlayFull from '@/views/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue'
import { FooterViewSelected, useAssetFooterSelectedView } from '@/composables/system/assetFooterSelected'
import { FooterViewUpload, useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import { onKeyUp } from '@vueuse/core'
import AssetListTableView from '@/views/coreDam/asset/list/components/AssetListTableView.vue'
import DistributionNewDialogEmpty
  from '@/views/coreDam/asset/detail/components/distribution/DistributionNewDialogEmpty.vue'
import AssetListTilesView from '@/views/coreDam/asset/list/components/AssetListTilesView.vue'

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

const componentComputed = computed<string>(() => {
  switch (gridView.value) {
    case GridView.Table:
      return AssetListTableView
    case GridView.Masonry:
    case GridView.Thumbnail:
    default:
      return AssetListTilesView
  }
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
        <div>
          <component
            :is="componentComputed"
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
        <AssetDetailDialog
          @prev-item="prevItem"
          @next-item="nextItem"
        />
      </div>
      <div
        v-else
        class="text-h6 text-medium-emphasis d-flex w-100 h-100 align-center justify-center"
      >
        {{ t('coreDam.asset.noItemsFound') }}
      </div>
    </template>
    <template #main-bar-left>
      <AssetToolbarSearch/>
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
      <AssetToolbarTypeFilters/>
    </template>
    <template #second-bar-right>
      <VBtn
        variant="text"
        icon
        size="x-small"
        class="ml-1"
        @click.stop="fetchAssetList"
      >
        <VIcon icon="mdi-refresh"/>
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
      <GridViewToggle class="hidden-xs"/>
      <VDivider
        vertical
        class="mx-1 my-2"
      />
    </template>
    <template #sidebar-left>
      <AssetListSidebarFilter/>
    </template>
    <template #sidebar-right>
      <AssetListSidebarMetadata/>
    </template>
    <template #custom-footer>
      <AssetFooterSelected/>
    </template>
    <template #custom-dialog>
      <div class="asset-footer d-flex flex-column justify-space-between w-100 h-100">
        <AssetFooterSelectedFull v-if="footerViewSelected === FooterViewSelected.Full"/>
        <AssetFooterUploadOverlayFull v-else-if="footerViewUpload === FooterViewUpload.Full"/>
      </div>
    </template>
  </MainWrapper>
</template>
