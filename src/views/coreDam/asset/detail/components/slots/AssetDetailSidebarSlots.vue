<script lang="ts" setup>
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import AssetDetailSidebarActionsWrapper
  from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetSlotListItem from '@/views/coreDam/asset/detail/components/slots/AssetSlotListItem.vue'
import {
  useAssetDetailSidebarSlotsActions
} from '@/views/coreDam/asset/detail/composables/assetDetailSidebarSlotsActions'
import {
  AAssetSelect,
  ADatatablePagination,
  ARow,
  type AssetSelectReturnData, DamAssetType,
  DamAssetType as AssetTypeValue,
  type DocId
} from '@anzusystems/common-admin'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import AssetChip from '@/views/coreDam/asset/detail/components/AssetChip.vue'
import AssetSibling from '@/views/coreDam/asset/detail/components/slots/AssetSibling.vue'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: DamAssetTypeType
    assetId: DocId
  }>(),
  {}
)

const { t } = useI18n()

const assetSlotsStore = useAssetSlotsStore()
const assetDetailStore = useAssetDetailStore()

const {
  getList,
  pagination,
  showPagination,
  unsetSlot,
  removeAssetFile,
  makeMainFile,
  duplicateSlot,
  switchSlot,
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
} = useAssetDetailSidebarSlotsActions(props.assetId, props.assetType)

onMounted(async () => {
  console.log('AssetDetailSidebarSlots.onMounted')
  assetSlotsStore.setAssetSlotsNamesFromConfig(props.assetType)
  await getList()
})

</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <ABtnPrimary
      :loading="assetSlotsStore.loader"
      @click.stop="getList"
    >
      {{ t('coreDam.asset.slots.actions.refreshList') }}
    </ABtnPrimary>
  </AssetDetailSidebarActionsWrapper>
  <AssetSibling
    v-if="assetType === DamAssetType.Video || assetType === DamAssetType.Audio"
    :asset-type="assetType"
    :asset-id="assetId"
  />
  <div
    v-if="assetSlotsStore.loader"
    class="d-flex w-100 h-100 justify-center align-center pa-2"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>
  <div
    v-else-if="assetSlotsStore.assetSlotNames.length === 0"
    class="pa-4 text-caption"
  >
    {{ t('coreDam.asset.slots.noEntries') }}
  </div>
  <div v-else-if="assetDetailStore.asset">
    <AssetSlotListItem
      v-for="(slot, slotName) in assetSlotsStore.getPositionedSlots"
      :key="slotName"
      :item="slot"
      :slot-name="slotName"
      :asset-type="assetType"
      :total-slot-count="assetSlotsStore.assetSlotNames.length"
      :asset-id="assetId"
      :title="assetDetailStore.asset.texts.displayTitle"
      @unset-slot="unsetSlot"
      @remove-file="removeAssetFile"
      @make-main-file="makeMainFile"
      @duplicate-slot="duplicateSlot"
      @switch-slot="switchSlot"
      @refresh-list="getList"
    />
    <ADatatablePagination
      v-if="showPagination"
      v-model="pagination"
      hide-records-per-page
      @change="getList"
    />
  </div>
</template>
