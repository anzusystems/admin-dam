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
  showDetail: [data: { assetId: DocId; index: number }]
  itemClick: [data: { assetId: DocId; index: number; tile: Element | null }]
  toggleSelected: [data: { assetId: DocId; index: number }]
  selectMultiple: [data: { assetId: DocId; index: number }]
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

// Pass the clicked element so a double click started on it can be told from one started elsewhere.
const onItemClick = (event: MouseEvent) => {
  emit('itemClick', { assetId: asset.value.id, index: props.index, tile: event.currentTarget as Element | null })
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
        <!--
          A link, so the router or browser handles its clicks. A plain click opens
          the detail page. A modifier key or another button opens it elsewhere.
          The list ignores both, and a double click here is two link clicks, not the row's double click.
        -->
        <ATableEditButton
          :record-id="asset.id"
          :route-name="'/(coreDam)/assets/[id]'"
          @click.stop=""
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
