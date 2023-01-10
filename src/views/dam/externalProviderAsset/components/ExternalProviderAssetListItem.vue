<script lang="ts" setup>
import { computed } from 'vue'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import AssetImage from '@/views/dam/asset/components/AssetImage.vue'
import type { ExternalProviderAssetListItem } from '@/stores/dam/externalProviderAssetListStore'
import type { AssetExternalProviderId, AssetExternalProviderListDto } from '@/types/dam/AssetExternalProvider'

const IMAGE_HEIGHT = 200
const IMAGE_BG_COLOR_DEFAULT = '#ccc'

const props = withDefaults(
  defineProps<{
    index: number
    item: ExternalProviderAssetListItem
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'showDetail', data: { assetId: AssetExternalProviderId; index: number }): void
  (e: 'itemClick', data: { assetId: AssetExternalProviderId; index: number }): void
  (e: 'toggleSelected', data: { assetId: AssetExternalProviderId; index: number }): void
  (e: 'selectMultiple', data: { assetId: AssetExternalProviderId; index: number }): void
}>()

const asset = computed<AssetExternalProviderListDto>(() => {
  return props.item.asset
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
  return IMAGE_BG_COLOR_DEFAULT
})

const imageWidth = computed(() => {
  return 400
})

const imageHeight = computed(() => {
  return IMAGE_HEIGHT
})

const imageSrc = computed(() => {
  if (asset.value.url) {
    return asset.value.url
  }
  return placeholder16x9
})
</script>

<template>
  <div
    class="dam-image-grid__item"
    :class="{ 'dam-image-grid__item--active': item.active, 'dam-image-grid__item--selected': item.selected }"
    @click.stop.exact="onItemClick"
    @dblclick.stop.exact="showDetail"
    @click.ctrl.stop="toggleSelected"
    @click.shift.stop="selectMultiple"
  >
    <div class="dam-image-grid__item-card">
      <div v-if="item.selected" class="selected-triangle">
        <div class="selected-triangle__bg"></div>
        <VIcon class="selected-triangle__icon" icon="mdi-check" color="white" size="x-small" />
      </div>
      <AssetImage
        :src="imageSrc"
        :background-color="backgroundColor"
        :width="imageWidth"
        :height="imageHeight"
        :fallback-height="IMAGE_HEIGHT"
      />
      <div class="dam-image-grid__item-text text-caption px-2 py-1">
        <div class="d-flex align-center justify-space-between position-relative">
          <div class="line-clamp-1">{{ asset.texts.displayTitle || '' }}</div>
          <div class="dam-image-grid__item-card-actions">
            <VBtn
              variant="flat"
              class="detail-icon mr-1"
              color="secondary"
              :width="34"
              :height="34"
              icon
              @click.stop="showDetail"
            >
              <VIcon icon="mdi-pencil" :size="20" />
            </VBtn>
            <VBtn
              variant="flat"
              class="detail-icon"
              color="secondary"
              :width="34"
              :height="34"
              icon
              @click.stop="toggleSelected"
            >
              <VIcon icon="mdi-checkbox-outline" :size="20" v-if="item.selected" />
              <VIcon icon="mdi-checkbox-blank-outline" :size="20" v-else />
            </VBtn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
