<script lang="ts" setup>
import { computed } from 'vue'
import type { AssetListItem } from '@/stores/dam/assetListStore'
import type { AssetSearchListItemDto } from '@/types/dam/Asset'
import type { DocId } from '@/types/common'
import { isImageFile } from '@/types/dam/File'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'

const IMAGE_HEIGHT = 200
const IMAGE_BG_COLOR_DEFAULT = '#ccc'

const props = withDefaults(
  defineProps<{
    index: number
    item: AssetListItem
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'showDetail', data: { assetId: DocId; index: number }): void
  (e: 'itemClick', data: { assetId: DocId; index: number }): void
  (e: 'toggleSelected', data: { assetId: DocId; index: number }): void
  (e: 'selectMultiple', data: { assetId: DocId; index: number }): void
}>()

const asset = computed<AssetSearchListItemDto>(() => {
  return props.item.asset
})

const assetType = computed(() => {
  return asset.value.attributes.assetType
})

const assetStatus = computed(() => {
  return asset.value.attributes.assetStatus
})

const showDetail = () => {
  emit('showDetail', { assetId: asset.value.id, index: props.index })
}

const onItemClick = () => {
  emit('itemClick', { assetId: asset.value.id, index: props.index })
}

const toggleSelected = () => {
  emit('toggleSelected', { assetId: asset.value.id, index: props.index })
}

const selectMultiple = () => {
  emit('selectMultiple', { assetId: asset.value.id, index: props.index })
}

const backgroundColor = computed(() => {
  if (
    asset.value &&
    asset.value.mainFile &&
    isImageFile(asset.value.mainFile) &&
    asset.value.mainFile.imageAttributes &&
    asset.value.mainFile.imageAttributes.mostDominantColor
  )
    return asset.value.mainFile.imageAttributes.mostDominantColor
  return IMAGE_BG_COLOR_DEFAULT
})

const imageWidth = computed(() => {
  if (asset.value.mainFile && isImageFile(asset.value.mainFile) && asset.value.mainFile.links[0]) {
    return asset.value.mainFile.links[0].width
  }
  return undefined
})

const imageHeight = computed(() => {
  if (asset.value.mainFile && isImageFile(asset.value.mainFile) && asset.value.mainFile.links[0]) {
    return asset.value.mainFile.links[0].height
  }
  return IMAGE_HEIGHT
})

const imageSrc = computed(() => {
  if (asset.value.mainFile && isImageFile(asset.value.mainFile) && asset.value.mainFile.links[0]) {
    return asset.value.mainFile.links[0].url
  }
  return placeholder16x9
})
</script>

<template>
  <div
    class="dam-image-grid__item"
    :class="{ 'dam-image-grid__item--active': item.active, 'dam-image-grid__item--selected': item.selected }"
    @click.stop.exact="onItemClick"
    @click.ctrl.stop="toggleSelected"
    @click.shift.stop="selectMultiple"
  >
    <div class="dam-image-grid__item-card">
      <div v-if="item.selected" class="selected-triangle">
        <div class="selected-triangle__bg"></div>
        <VIcon class="selected-triangle__icon" icon="mdi-check" color="white" size="x-small" />
      </div>
      <div class="dam-image-grid__item-card-actions">
        <VBtn variant="flat" class="detail-icon" :width="26" :height="26" icon @click.stop="showDetail">
          <VIcon icon="mdi-pencil" size="16" />
        </VBtn>
        <VBtn variant="flat" class="detail-icon" :width="26" :height="26" icon @click.stop="toggleSelected">
          <VIcon icon="mdi-checkbox-outline" size="16" v-if="item.selected" />
          <VIcon icon="mdi-checkbox-blank-outline" size="16" v-else />
        </VBtn>
      </div>
      <AssetImage
        :asset-type="assetType"
        :asset-status="assetStatus"
        :src="imageSrc"
        :background-color="backgroundColor"
        :width="imageWidth"
        :height="imageHeight"
        :fallback-height="IMAGE_HEIGHT"
      />
      <div class="dam-image-grid__item-text text-caption px-2 py-1">
        <div class="d-flex align-center">
          <div class="line-clamp-1">{{ asset.texts.displayTitle || 'no title todo' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
