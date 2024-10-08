<script lang="ts" setup>
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'
import { useAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { useAssetStatus } from '@/model/coreDam/valueObject/DamAssetStatus'
import { useI18n } from 'vue-i18n'
import { useImageOrientation } from '@/model/coreDam/valueObject/ImageOrientation'
import FilterClosestColor from '@/components/filter/FilterClosestColor.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import DistributionServiceNameFilter from '@/views/coreDam/distribution/components/DistributionServiceNameFilter.vue'
import AssetSlotsFilter from '@/views/coreDam/asset/components/AssetSlotsFilter.vue'
import {
  AFilterBooleanSelect,
  AFilterDatetimePicker,
  AFilterInteger,
  AFilterString,
  AFilterValueObjectOptionsSelect,
} from '@anzusystems/common-admin'
import KeywordTitleFilter from '@/views/coreDam/keyword/components/KeywordTitleRemoteSelect.vue'
import AuthorTitleRemoteSelect from '@/views/coreDam/author/components/AuthorTitleRemoteSelect.vue'
import AnzuUserRemoteSelect from '@/views/common/anzuUser/components/AnzuUserRemoteSelect.vue'

const { sidebarLeft } = useMainWrapper()

const { t } = useI18n()

const { filter, fetchAssetList, resetAssetList, filterTouch, filterUnTouch, filterIsTouched } = useAssetListActions()

const { assetTypeOptions } = useAssetType()
const { assetStatusOptions } = useAssetStatus()
const { imageOrientationOptions } = useImageOrientation()

const submitFilter = () => {
  filterUnTouch()
  fetchAssetList()
}

const resetFilter = () => {
  resetAssetList()
  filterUnTouch()
}

const onAnyFilterUpdate = () => {
  filterTouch()
}
</script>

<template>
  <VNavigationDrawer
    v-model="sidebarLeft"
    permanent
    :width="300"
  >
    <div class="v-expansion-panel-title px-2">
      {{ t('coreDam.asset.filterTitle') }}
    </div>
    <div class="pa-2">
      <VForm
        name="search2"
        @submit.prevent="submitFilter"
      >
        <VRow>
          <VCol>
            <AFilterString
              v-model="filter.text"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterString
              v-model="filter.assetAndMainFileIds"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <KeywordTitleFilter
              v-model="filter.keywordIds"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AuthorTitleRemoteSelect
              v-model="filter.authorIds"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AnzuUserRemoteSelect
              v-model="filter.createdByIds"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterValueObjectOptionsSelect
              v-model="filter.type"
              :items="assetTypeOptions"
              multiple
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanSelect
              v-model="filter.inPodcast"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanSelect
              v-model="filter.fromRss"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterValueObjectOptionsSelect
              v-model="filter.status"
              :items="assetStatusOptions"
              multiple
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanSelect
              v-model="filter.described"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanSelect
              v-model="filter.visible"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanSelect
              v-model="filter.generatedBySystem"
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AssetSlotsFilter
              v-model="filter.slotNames"
              multiple
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <DistributionServiceNameFilter
              v-model="filter.distributedInServices"
              multiple
              @update:model-value="onAnyFilterUpdate"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <FilterClosestColor
              v-model="filter.closestMostDominantColor"
              multiple
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterValueObjectOptionsSelect
              v-model="filter.orientation"
              :items="imageOrientationOptions"
              multiple
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.pixelSizeFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.pixelSizeUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.widthFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.widthUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.heightFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.heightUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.shortestDimensionFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.shortestDimensionUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.ratioWidthFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.ratioWidthUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.ratioHeightFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.ratioHeightUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.rotationFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.rotationUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.durationFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.durationUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.bitrateFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.bitrateUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              v-model="filter.slotsCountFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              v-model="filter.slotsCountFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterDatetimePicker
              v-model="filter.createdAtFrom"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterDatetimePicker
              v-model="filter.createdAtUntil"
              @update:model-value="onAnyFilterUpdate"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
      </VForm>
    </div>
    <template #append>
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn
          color="primary"
          class="mr-2"
          :variant="filterIsTouched ? 'flat' : 'text'"
          size="small"
          @click.stop="submitFilter"
        >
          {{ t('common.button.submitFilter') }}
        </VBtn>
        <VBtn
          class="px-2"
          color="light"
          min-width="36px"
          variant="flat"
          size="small"
          @click.stop="resetFilter"
        >
          <VIcon icon="mdi-filter-remove-outline" />
          <VTooltip
            activator="parent"
            location="bottom"
          >
            {{ t('common.button.resetFilter') }}
          </VTooltip>
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
