<script lang="ts" setup>
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'
import { useAssetListActions } from '@/domains/coreDam/asset/components/list/composables/assetListActions'
import { useGridView } from '@/domains/system/composables/gridView'
import AssetListItem from '@/domains/coreDam/asset/components/list/components/AssetListItem.vue'

const { sidebarRight } = useMainWrapper()

const { gridView } = useGridView()

const { items, showDetail, onItemClick, toggleSelected, selectMultiple, showMetaIcons } =
  useAssetListActions(sidebarRight)
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
