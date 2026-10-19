<script lang="ts" setup>
import {
  AChipNoLink,
  ADamAssetImage,
  ADamAssetImageMetaIcons,
  ADatetime,
  ATableCopyIdButton,
  ATableEditButton,
  prettyBytes,
  useDamCachedUsers,
} from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { useAssetItemActions } from '@/domains/coreDam/asset/components/list/composables/assetItemActions'
import type { AssetListItem } from '@/domains/coreDam/asset/store/assetListStore'
import CachedPodcastChip from '@/domains/coreDam/podcast/components/CachedPodcastChip.vue'
import { useCachedPodcasts } from '@/domains/coreDam/podcast/composables/cachedPodcasts'
import CachedDamUserChip from '@/domains/coreDam/shared/components/CachedDamUserChip.vue'

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

const { fetchCachedUsers, addToCachedUsers } = useDamCachedUsers()

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { asset, assetType, assetStatus, tableImageProperties } = useAssetItemActions(props.item)

const { addToCachedPodcasts, fetchCachedPodcasts } = useCachedPodcasts()

const showDetail = () => {
  emit('showDetail', { assetId: asset.value.id, index: props.index })
}

/* The edit button is a link. A plain click of it is the router's: it goes to the page of the detail, and the list
 * does nothing with it. A click the router leaves to the browser (a modifier key held: a new tab, a new window, a
 * download) keeps the list, which opens its own detail over it. The conditions are the router's own. A double click
 * is two of those clicks and nothing more: it is not the double click of the row, which opens the detail. */
const followDetailLink = (event: MouseEvent) => {
  if (!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) && event.button === 0) return
  showDetail()
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
          :aria-label="t('coreDam.asset.list.toggleSelect')"
          :model-value="item.selected"
          @click.stop="toggleSelected"
        />
      </div>
    </td>
    <td>
      <div class="d-flex align-center">
        <ADamAssetImage
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
      <ADamAssetImageMetaIcons
        :asset-file-properties="item.asset.assetFileProperties"
        :asset-type="assetType"
        disable-absolute
        show-tts
      />
      <CachedPodcastChip
        v-for="podcastItem in item.asset.podcasts"
        :id="podcastItem"
        :key="podcastItem"
        class="pr-1"
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
          :route-name="'/(coreDam)/assets/[id]'"
          @click.stop="followDetailLink"
          @dblclick.stop=""
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
