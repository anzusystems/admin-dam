<script lang="ts" setup>
import type { AssetListItem } from '@/stores/coreDam/assetListStore'
import AssetImage from '@/views/coreDam/asset/components/AssetImage.vue'
import type { DocId } from '@anzusystems/common-admin'
import { AChipNoLink, ADatetime, ATableCopyIdButton, ATableEditButton, prettyBytes } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import CachedDamUserChip from '@/components/CachedDamUserChip.vue'
import { useAssetItemActions } from '@/views/coreDam/asset/list/composables/assetItemActions'
import AssetImageMetaIcons from '@/views/coreDam/asset/components/AssetImageMetaIcons.vue'
import { useCachedUsers } from '@/views/coreDam/user/composables/cachedUsers'
import { onMounted } from 'vue'
import CachedPodcastChip from '@/views/coreDam/podcast/components/CachedPodcastChip.vue'
import { useCachedPodcasts } from '@/views/coreDam/podcast/composables/cachedPodcasts'
import { ROUTE } from '@/router/routes'

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

const IMAGE_HEIGHT = 72
const IMAGE_WIDTH = 128

const { fetchCachedUsers, addToCachedUsers } = useCachedUsers()

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { asset, assetType, assetStatus, tableImageProperties } = useAssetItemActions(props.item)

const { addToCachedPodcasts, fetchCachedPodcasts } = useCachedPodcasts()

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
      <div class="d-flex a-table__row--toggle">
        <VCheckboxBtn
          :model-value="item.selected"
          @click.stop="toggleSelected"
        />
      </div>
    </td>
    <td>
      <div class="d-flex align-center">
        <AssetImage
          :asset-type="assetType"
          :asset-status="assetStatus"
          :src="tableImageProperties.url"
          :background-color="tableImageProperties.bgColor"
          :width="IMAGE_WIDTH"
          :height="IMAGE_HEIGHT"
          :icon-size="20"
          :fallback-height="IMAGE_HEIGHT"
          :show-meta-icons="false"
        />
      </div>
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
        disable-absolute
      />
      <CachedPodcastChip
        v-for="podcastItem in item.asset.podcasts"
        :id="podcastItem"
        :key="podcastItem"
        class="pr-1"
        :item="podcastItem"
      />
    </td>
    <td>
      {{ item.asset.mainFile?.fileAttributes.mimeType }}
    </td>
    <td>
      {{ prettyBytes(item.asset.mainFile?.fileAttributes.size || 0) }}
    </td>
    <td>
      <CachedDamUserChip :id="asset.createdBy" />
    </td>
    <td>
      <AChipNoLink
        v-for="text in asset.assetFileProperties.slotNames"
        :key="text"
        class="mr-1"
      >
        {{ text }}
      </AChipNoLink>
    </td>
    <td>
      <div class="d-flex justify-end">
        <ATableCopyIdButton :id="asset.id" />
        <ATableEditButton
          :record-id="asset.id"
          :route-name="ROUTE.DAM.ASSET.DETAIL"
          @click.stop="showDetail"
        />
      </div>
    </td>
  </tr>
</template>

<style lang="scss">
.a-table__row--toggle {
  opacity: 0;
}

.a-table__row {
  &:hover {
    .a-table__row--toggle {
      opacity: 1;
    }
  }
}
</style>
