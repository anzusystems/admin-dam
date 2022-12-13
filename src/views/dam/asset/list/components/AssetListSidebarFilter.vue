<script lang="ts" setup>
import AFilterString from '@/components/filter/AFilterString.vue'
import AFilterBooleanGroup from '@/components/filter/AFilterBooleanGroup.vue'
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'
import AFilterValueObject from '@/components/filter/AFilterValueObject.vue'
import { useAssetType } from '@/model/dam/valueObject/AssetType'
import { useAssetStatus } from '@/model/dam/valueObject/AssetStatus'
import { useI18n } from 'vue-i18n'
import { useImageOrientation } from '@/model/dam/valueObject/ImageOrientation'
import AFilterInteger from '@/components/filter/AFilterInteger.vue'
import ClosestColor from '@/components/filter/ClosestColor.vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'

const { sidebarLeft } = useMainWrapper()

const { t } = useI18n({ useScope: 'global' })

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
  <VNavigationDrawer v-model="sidebarLeft" permanent :width="300">
    <div class="v-expansion-panel-title px-2">{{ t('coreDam.asset.filterTitle') }}</div>
    <div class="pa-2">
      <VForm name="search2" @submit.prevent="submitFilter">
        <VRow>
          <VCol>
            <AFilterString
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.text"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterValueObject
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.type"
              :items="assetTypeOptions"
              multiple
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanGroup @update:model-value="onAnyFilterUpdate" v-model="filter.inPodcast" />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterValueObject
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.status"
              :items="assetStatusOptions"
              multiple
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanGroup @update:model-value="onAnyFilterUpdate" v-model="filter.described" />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterBooleanGroup @update:model-value="onAnyFilterUpdate" v-model="filter.visible" />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <ClosestColor
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.closestMostDominantColor"
              multiple
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterValueObject
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.orientation"
              :items="imageOrientationOptions"
              multiple
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.pixelSizeFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.pixelSizeUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.widthFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.widthUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.heightFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.heightUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.ratioWidthFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.ratioWidthUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.ratioHeightFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.ratioHeightUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.rotationFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.rotationUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.durationFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.durationUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.bitrateFrom"
              @keydown.enter="submitFilter"
            />
          </VCol>
          <VCol>
            <AFilterInteger
              @update:model-value="onAnyFilterUpdate"
              v-model="filter.bitrateUntil"
              @keydown.enter="submitFilter"
            />
          </VCol>
        </VRow>
      </VForm>
    </div>
    <template v-slot:append>
      <div class="pa-2 d-flex align-center justify-center">
        <VBtn
          :color="filterIsTouched ? 'success' : 'secondary'"
          @click.stop="submitFilter"
          class="mr-2"
          variant="flat"
          size="small"
        >
          {{ t('common.button.submitFilter') }}
        </VBtn>
        <VBtn class="px-2" color="light" min-width="36px" @click.stop="resetFilter" variant="flat" size="small">
          <VIcon icon="mdi-filter-remove-outline" />
        </VBtn>
      </div>
    </template>
  </VNavigationDrawer>
</template>
