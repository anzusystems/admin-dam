<script lang="ts" setup>
import FilterClosestColor from '@/domains/coreDam/shared/components/FilterClosestColor.vue'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useAssetStatus } from '@/domains/coreDam/asset/valueObject/DamAssetStatus'
import { useAssetType } from '@/domains/coreDam/asset/valueObject/DamAssetType'
import { useImageOrientation } from '@/domains/coreDam/asset/valueObject/ImageOrientation'
import AssetSlotsFilter from '@/domains/coreDam/asset/components/AssetSlotsFilter.vue'
import DistributionServiceNameFilter from '@/domains/coreDam/shared/distribution/components/DistributionServiceNameFilter.vue'
import {
  DamAuthorFilterRemoteAutocomplete,
  DamKeywordFilterRemoteAutocomplete,
  DamUserFilterRemoteAutocomplete,
} from '@anzusystems/common-admin'
import {
  AFilterBooleanSelect,
  AFilterInteger,
  AFilterString,
  AFilterTimeInterval,
  AFilterValueObjectOptionsSelect,
} from '@anzusystems/common-admin/labs'
import { allowedTimeIntervalValuesSubject } from '@/domains/system/composables/timeInterval'

const { assetTypeOptions } = useAssetType()
const { assetStatusOptions } = useAssetStatus()
const { imageOrientationOptions } = useImageOrientation()
const { currentExtSystemId } = useCurrentExtSystem()
</script>

<template>
  <VRow>
    <VCol>
      <AFilterString name="text" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterString name="assetAndMainFileIds" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <DamKeywordFilterRemoteAutocomplete
        name="keywordIds"
        :ext-system="currentExtSystemId"
      />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <DamAuthorFilterRemoteAutocomplete
        name="authorIds"
        :ext-system="currentExtSystemId"
      />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <DamUserFilterRemoteAutocomplete name="createdByIds" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterValueObjectOptionsSelect
        name="type"
        :items="assetTypeOptions"
      />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="inPodcast" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="fromRss" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="ttsAudio" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterValueObjectOptionsSelect
        name="status"
        :items="assetStatusOptions"
      />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="mainFileSingleUse" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="mainFileInternal" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="described" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="visible" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterBooleanSelect name="generatedBySystem" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AssetSlotsFilter name="slotNames" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <DistributionServiceNameFilter name="distributedInServices" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <FilterClosestColor name="closestMostDominantColor" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterValueObjectOptionsSelect
        name="orientation"
        :items="imageOrientationOptions"
      />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="pixelSizeFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="pixelSizeUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="widthFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="widthUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="heightFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="heightUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="shortestDimensionFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="shortestDimensionUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="ratioWidthFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="ratioWidthUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="ratioHeightFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="ratioHeightUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="rotationFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="rotationUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="durationFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="durationUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="bitrateFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="bitrateUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterInteger name="slotsCountFrom" />
    </VCol>
    <VCol>
      <AFilterInteger name="slotsCountUntil" />
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <AFilterTimeInterval
        name-from="createdAtFrom"
        name-until="createdAtUntil"
        :allowed="allowedTimeIntervalValuesSubject"
      />
    </VCol>
  </VRow>
</template>
