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
import { useCachedUsers } from '@/views/coreDam/user/composables/cachedUsers'
import { onMounted } from 'vue'
import CachedPodcastChip from '@/views/coreDam/podcast/components/CachedPodcastChip.vue'
import { useCachedPodcasts } from '@/views/coreDam/podcast/composables/cachedPodcasts'

const { t } = useI18n()

const IMAGE_HEIGHT = 70

const { fetchCachedUsers, addToCachedUsers } = useCachedUsers()

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
  tableImageProperties,
} = useAssetItemActions(props.item)

const {
  addToCachedPodcasts,
  fetchCachedPodcasts,
} = useCachedPodcasts()

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

onMounted(() => {
  addToCachedUsers(props.item.asset.createdBy)
  fetchCachedUsers() // todo add to list
  addToCachedPodcasts(props.item.asset.podcasts)
  fetchCachedPodcasts()
})

</script>

<template>
  <tr
    class="a-table__row"
    :class="{ 'a-table__row--selected': item.selected, 'a-table__row--active': item.active }"
    @click.stop.exact="onItemClick"
    @dblclick.stop.exact="showDetail"
    @click.ctrl.stop="toggleSelected"
    @click.shift.stop="selectMultiple"
  >
    <td>
      <AssetImage
        :asset-type="assetType"
        :asset-status="assetStatus"
        :src="tableImageProperties.url"
        :background-color="tableImageProperties.bgColor"
        :width="tableImageProperties.width"
        :height="IMAGE_HEIGHT"
        :icon-size="20"
        :fallback-height="IMAGE_HEIGHT"
        :show-meta-icons="false"
      />
    </td>
    <td>
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
      <CachedPodcastChip
        v-for="podcastItem in item.asset.podcasts"
        :id="podcastItem"
        :key="podcastItem"
        :item="podcastItem"
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
