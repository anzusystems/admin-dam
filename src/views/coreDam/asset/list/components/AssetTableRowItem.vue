<script lang="ts" setup>

import { AssetListItem } from '@/stores/coreDam/assetListStore'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import type { DocId } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import {
  ADatetime, prettyBytes,
} from '@anzusystems/common-admin'
import CachedDamUserChip from '@/components/CachedDamUserChip.vue'
import { useAssetItemActions } from '@/views/coreDam/asset/list/composables/assetItemActions'
import AssetImageMetaIcons from '@/views/coreDam/asset/components/AssetImageMetaIcons.vue'

const { t } = useI18n()

const IMAGE_HEIGHT = 70

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

const {
  asset,
  assetType,
  assetStatus,
  imageProperties,
} = useAssetItemActions(props.item)

const emit = defineEmits<{
  (e: 'showDetail', data: { assetId: DocId; index: number }): void
  (e: 'itemClick', data: { assetId: DocId; index: number }): void
  (e: 'toggleSelected', data: { assetId: DocId; index: number }): void
  (e: 'selectMultiple', data: { assetId: DocId; index: number }): void
}>()

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
  <tr
    @click.stop.exact="onItemClick"
    @dblclick.stop.exact="showDetail"
    @click.ctrl.stop="toggleSelected"
    @click.shift.stop="selectMultiple"
  >
    <td>
      <AssetImage
        :asset-type="assetType"
        :asset-status="assetStatus"
        :src="imageProperties.url"
        :background-color="imageProperties.bgColor"
        :width="imageProperties.width"
        :height="IMAGE_HEIGHT"
        :icon-size="20"
        :fallback-height="IMAGE_HEIGHT"
        :show-meta-icons="false"
      />
    </td>
    <td>
      {{ item.active }}
      {{ asset.texts.displayTitle || t('coreDam.asset.list.noTitle') }}
    </td>
    <td>
      <ADatetime :date-time="item.asset.createdAt" />
    </td>
    <td>
      <AssetImageMetaIcons
        :asset-file-properties="item.asset.assetFileProperties"
        :asset-type="assetType"
      />
    </td>
    <td>
      {{ item.asset.mainFile.fileAttributes.mimeType }}
    </td>
    <td>
      {{ prettyBytes(item.asset.mainFile.fileAttributes.size) }}
    </td>
    <td>
      <CachedDamUserChip :id="asset.createdBy" />
    </td>
    <td>
      <span
        v-for="text in asset.assetFileProperties.slotNames"
        :key="text"
      >{{ text }}</span>
    </td>
    <td>
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
    </td>
  </tr>
</template>
