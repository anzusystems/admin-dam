<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { DamAssetType, DocId } from '@anzusystems/common-admin'
import { ADatatablePagination } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetSlotListItem from '@/views/coreDam/asset/detail/components/slots/AssetSlotListItem.vue'
import { useAssetDetailSidebarSlotsActions } from '@/views/coreDam/asset/detail/composables/assetDetailSidebarSlotsActions'
import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import AssetFilePublicLinkPrivateDialog from '@/views/coreDam/assetFileRoute/components/AssetFileRouteMakePublicDialog.vue'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: DamAssetType
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
} = useAssetDetailSidebarSlotsActions(props.assetId, props.assetType)

onMounted(async () => {
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
