<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { DocId } from '@anzusystems/common-admin'
import { ADatatablePagination } from '@anzusystems/common-admin'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetSlotListItem from '@/views/coreDam/asset/detail/components/slots/AssetSlotListItem.vue'
import { useAssetDetailSidebarSlotsActions } from '@/views/coreDam/asset/detail/composables/assetDetailSidebarSlotsActions'
import { useAssetSlotsStore } from '@/stores/coreDam/assetSlotsStore'
import AssetFilePublicLinkPrivateDialog from '@/views/coreDam/asset/detail/components/AssetFilePublicLinkPrivateDialog.vue'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    isActive: boolean
    assetType: AssetType
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
  makeFilePrivate,
} = useAssetDetailSidebarSlotsActions(props.assetId, props.assetType)

const makeFilePrivateDialog = ref(false)
const makeFilePrivateDialogFileId = ref<DocId>('')

const openMakeFilePrivateDialog = (fileId: DocId) => {
  makeFilePrivateDialogFileId.value = fileId
  makeFilePrivateDialog.value = true
}

onMounted(async () => {
  assetSlotsStore.setAssetSlotsNamesFromConfig(props.assetType)
  await getList()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn :loading="assetSlotsStore.loader" color="secondary" variant="flat" @click.stop="getList">
      {{ t('coreDam.asset.slots.actions.refreshList') }}
    </VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div v-if="assetSlotsStore.loader" class="d-flex w-100 h-100 justify-center align-center pa-2">
    <VProgressCircular indeterminate color="primary" />
  </div>
  <div v-else-if="assetSlotsStore.assetSlotNames.length === 0" class="pa-4 text-caption">
    {{ t('coreDam.asset.slots.noEntries') }}
  </div>
  <div v-else>
    <AssetSlotListItem
      v-for="(slot, slotName) in assetSlotsStore.getPositionedSlots"
      :key="slotName"
      :item="slot"
      :slot-name="slotName"
      :asset-type="assetType"
      :total-slot-count="assetSlotsStore.assetSlotNames.length"
      :asset-id="assetId"
      @unset-slot="unsetSlot"
      @remove-file="removeAssetFile"
      @make-main-file="makeMainFile"
      @duplicate-slot="duplicateSlot"
      @switch-slot="switchSlot"
      @refresh-list="getList"
      @make-file-private="makeFilePrivate"
      @open-make-file-private-dialog="openMakeFilePrivateDialog"
    />
    <ADatatablePagination v-if="showPagination" v-model="pagination" hide-records-per-page @change="getList" />
  </div>
  <AssetFilePublicLinkPrivateDialog
    v-if="assetDetailStore.asset"
    v-model="makeFilePrivateDialog"
    :file-id="makeFilePrivateDialogFileId"
    :title="assetDetailStore.asset.texts.displayTitle"
    @after-update="getList"
  />
</template>