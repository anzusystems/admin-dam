<script setup lang="ts">
import {
  AAssetSelect,
  type AssetSelectReturnData, DamAssetType,
  type DocId,
} from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import AssetChip from '@/views/coreDam/asset/detail/components/AssetChip.vue'
import { useI18n } from 'vue-i18n'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import { computed } from 'vue'
import {
  useAssetDetailSidebarSlotsAssetSiblingActions
} from '@/views/coreDam/asset/detail/composables/assetDetailSidebarSlotsAssetSiblingActions'
import { storeToRefs } from 'pinia'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    assetId: DocId
  }>(),
  {}
)

const assetDetailStore = useAssetDetailStore()
const { asset, siblingLoader } = storeToRefs(assetDetailStore)
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { t } = useI18n()

const { setAssetSibling, removeAssetSibling } = useAssetDetailSidebarSlotsAssetSiblingActions()

const selectAsset = (data: AssetSelectReturnData) => {
  if (data.type === 'assetId') {
    let assetId = data.value[0] || ''
    setAssetSibling(assetId)
  }
}

const removeItem = (index: number) => {
  removeAssetSibling()
}

const pickAssetType = computed(() => {
  if (props.assetType === DamAssetType.Video) {
    return DamAssetType.Audio
  }
  if (props.assetType === DamAssetType.Audio) {
    return DamAssetType.Video
  }

  return undefined
})

</script>

<template>
  <div
    v-if="assetDetailStore.asset"
    class="pa-4 pb-8 text-body-2"
  >
    <VRow>
      <VCol>
        <div class="font-weight-bold">
          {{ t('coreDam.asset.sibling.title') }}
        </div>
        <div v-if="assetDetailStore.asset.siblingToAsset">
          <AssetChip  :id="assetDetailStore.asset.siblingToAsset" />
          <VBtn
            icon="mdi-trash-can-outline"
            variant="text"
            size="small"
            @click.stop="removeItem"
            :loading="siblingLoader"
          />
        </div>
        <div v-else>-</div>
      </VCol>
      <VCol
        cols="3"
        class="text-right"
      >
        <AAssetSelect
          v-if="pickAssetType"
          :select-licences="[currentAssetLicenceId]"
          :min-count="1"
          :max-count="1"
          returnType="assetId"
          :asset-type="pickAssetType"
          @on-confirm="selectAsset"
        >
          <template #activator="{ props: assetSelectProps }">
            <VBtn
              variant="text"
              class="my-2 mr-2"
              size="small"
              v-bind="assetSelectProps"
              :loading="siblingLoader"
            >
              {{ t('coreDam.asset.sibling.select') }}
            </VBtn>
          </template>
        </AAssetSelect>
      </VCol>
    </VRow>
  </div>
  <div
    v-else
    class="pa-4 text-caption"
  >
    {{ t('coreDam.asset.sibling.noAsset') }}
  </div>
</template>
