<script lang="ts" setup>
import type { AssetListItem } from '@/stores/coreDam/assetListStore'
import type { DocId } from '@anzusystems/common-admin'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import { useI18n } from 'vue-i18n'
import { useAssetItemActions } from '@/views/coreDam/asset/list/composables/assetItemActions'

const props = withDefaults(
  defineProps<{
    index: number
    item: AssetListItem
    showMetaIcons?: boolean
  }>(),
  {
    showMetaIcons: false,
  }
)

const emit = defineEmits<{
  (e: 'showDetail', data: { assetId: DocId; index: number }): void
  (e: 'itemClick', data: { assetId: DocId; index: number }): void
  (e: 'toggleSelected', data: { assetId: DocId; index: number }): void
  (e: 'selectMultiple', data: { assetId: DocId; index: number }): void
}>()

const { t } = useI18n()

const IMAGE_HEIGHT = 200

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { asset, assetType, assetStatus, imageProperties } = useAssetItemActions(props.item)

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
      <div
        v-if="item.selected"
        class="selected-triangle"
      >
        <div class="selected-triangle__bg" />
        <VIcon
          class="selected-triangle__icon"
          icon="mdi-check"
          color="white"
          size="large"
        />
      </div>
      <AssetImage
        :asset-type="assetType"
        :asset-status="assetStatus"
        :src="imageProperties.url"
        :background-color="imageProperties.bgColor"
        :width="imageProperties.width"
        :height="imageProperties.height"
        :fallback-height="IMAGE_HEIGHT"
        :asset-file-properties="item.asset.assetFileProperties"
        :show-meta-icons="showMetaIcons"
      />
      <div class="dam-image-grid__item-text text-caption px-2 py-1">
        <div class="d-flex align-center justify-space-between position-relative">
          <div class="line-clamp-1">
            {{ asset.texts.displayTitle || t('coreDam.asset.list.noTitle') }}
          </div>
          <div class="dam-image-grid__item-card-actions">
            <VBtn
              variant="flat"
              class="detail-icon mr-1"
              color="secondary"
              :width="34"
              :height="34"
              icon
              @click.stop="toggleSelected"
            >
              <VIcon
                v-if="item.selected"
                icon="mdi-checkbox-outline"
                :size="20"
              />
              <VIcon
                v-else
                icon="mdi-checkbox-blank-outline"
                :size="20"
              />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.list.toggleSelect') }}
              </VTooltip>
            </VBtn>
            <VBtn
              variant="flat"
              color="secondary"
              class="detail-icon"
              :width="34"
              :height="34"
              icon
              @click.stop="showDetail"
            >
              <VIcon
                icon="mdi-pencil"
                :size="20"
              />
              <VTooltip
                activator="parent"
                location="bottom"
              >
                {{ t('coreDam.asset.list.edit') }}
              </VTooltip>
            </VBtn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
