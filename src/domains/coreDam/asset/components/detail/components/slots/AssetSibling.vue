<script setup lang="ts">
import {
  AAssetSelect,
  type AssetSelectReturnData,
  DamAssetType,
  type DamAssetTypeType,
  SortOrder,
} from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import AssetChip from '@/domains/coreDam/asset/components/detail/components/AssetChip.vue'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetDetailSidebarSlotsAssetSiblingActions } from '@/domains/coreDam/asset/components/detail/composables/assetDetailSidebarSlotsAssetSiblingActions'
import {
  customSortOptions,
  SORT_BY_SCORE_DATE,
} from '@/domains/coreDam/asset/components/list/composables/assetListActions'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    assetId: DocId
  }>(),
  {}
)

const assetDetailStore = useAssetDetailStore()
const { siblingLoader } = storeToRefs(assetDetailStore)
const { currentAssetLicenceId } = useCurrentAssetLicence()
const { t } = useI18n()
const sort = ref(1)

const { setAssetSibling, removeAssetSibling } = useAssetDetailSidebarSlotsAssetSiblingActions()

const selectAsset = (data: AssetSelectReturnData) => {
  if (data.type === 'assetId') {
    const assetId = data.value[0] || ''
    setAssetSibling(assetId)
  }
}

const removeItem = () => {
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
    class="pa-4 pb-8 text-body-medium"
  >
    <VRow>
      <VCol>
        <div class="font-weight-bold">
          {{ t('coreDam.asset.sibling.title') }}
        </div>
        <div v-if="assetDetailStore.asset.siblingToAsset">
          <AssetChip :id="assetDetailStore.asset.siblingToAsset" />
          <VBtn
            icon="mdi-trash-can-outline"
            variant="text"
            size="small"
            :loading="siblingLoader"
            @click.stop="removeItem"
          />
        </div>
        <div v-else>
          -
        </div>
      </VCol>
      <VCol
        cols="3"
        class="text-right"
      >
        <AAssetSelect
          v-if="pickAssetType"
          v-model:sort="sort"
          :select-licences="[currentAssetLicenceId]"
          :min-count="1"
          :max-count="1"
          return-type="assetId"
          :asset-type="pickAssetType"
          :initial-pagination-sort="{ key: SORT_BY_SCORE_DATE, order: SortOrder.Desc }"
          :custom-sort-options="customSortOptions"
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
    class="pa-4 text-body-small"
  >
    {{ t('coreDam.asset.sibling.noAsset') }}
  </div>
</template>
