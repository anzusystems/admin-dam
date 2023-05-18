<script lang="ts" setup>

import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'
import { useI18n } from 'vue-i18n'
import { useGridView } from '@/composables/system/gridView'
import AssetListItem from '@/views/coreDam/asset/list/components/AssetListItem.vue'

const { sidebarRight } = useMainWrapper()

const { t } = useI18n()

const { gridView } = useGridView()

const {
  items,
  showDetail,
  onItemClick,
  toggleSelected,
  selectMultiple,
  showMetaIcons,
} = useAssetListActions(sidebarRight)

</script>

<template>
  <div
    class="dam-image-grid"
    :class="'dam-image-grid--' + gridView"
  >
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
  </div>
</template>
