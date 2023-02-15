<script lang="ts" setup>
import { AssetType } from '@/model/dam/valueObject/AssetType'
import type { AssetFileProperties } from '@/types/dam/Asset'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import {
  DIMENSIONS_CONFIG,
  ICON_LOW,
  ICON_SLOTS,
  LOW_DIMENSION,
} from '@/views/dam/asset/components/assetImageIconsConfig'
import type { AssetImageIconsOptions } from '@/types/dam/AssetImageIconsOptions'

const props = withDefaults(
  defineProps<{
    assetType: AssetType
    assetFileProperties: AssetFileProperties
  }>(),
  {}
)

const checkDimensions = (options: AssetImageIconsOptions) => {
  if (props.assetFileProperties.width < LOW_DIMENSION || props.assetFileProperties.height < LOW_DIMENSION) {
    options.showLow = true
    options.show = true
    return
  }
  if (props.assetType !== AssetType.Video) return
  for (let i = 0; i < DIMENSIONS_CONFIG.length; i++) {
    if (
      props.assetFileProperties.width === DIMENSIONS_CONFIG[i].width &&
      props.assetFileProperties.height === DIMENSIONS_CONFIG[i].height
    ) {
      options.showVideoDimensions = true
      options.videoDimensionsSvgSrc = DIMENSIONS_CONFIG[i].svgSrc
      options.show = true
      break
    }
  }
}

const checkDistributions = (options: AssetImageIconsOptions) => {
  for (let i = 0; i < props.assetFileProperties.distributesInServices.length; i++) {
    options.distributions.push({
      id: props.assetFileProperties.distributesInServices[i],
      svgUrl: "https://web-static.smedata.sk/2.18.0/weather/images/weather-icons/clear_sky.svg'", // todo from config
      name:
        damConfigExtSystem[props.assetType].distribution.distributionRequirements[
          props.assetFileProperties.distributesInServices[i]
        ].title || props.assetFileProperties.distributesInServices[i],
    })
    options.show = true
  }
}

const data = computed(() => {
  const options: AssetImageIconsOptions = {
    show: false,
    showSlots: false,
    showRSS: false,
    showLow: false,
    showVideoDimensions: false,
    videoDimensionsSvgSrc: '',
    distributions: [],
  }
  if (props.assetFileProperties.slotNames.length > 1) {
    options.showSlots = true
    options.show = true
  }
  if (props.assetFileProperties.fromRss) {
    options.showRSS = true
    options.show = true
  }
  checkDimensions(options)
  checkDistributions(options)

  return options
})
</script>

<template>
  <div v-show="data.show" class="asset-image__meta-icons">
    <img v-show="data.showSlots" class="img-svg" :src="ICON_SLOTS" title="" />
    <img v-show="data.showLow" class="img-svg" :src="ICON_LOW" title="" />
    <img v-if="data.showVideoDimensions" class="img-svg" :src="data.videoDimensionsSvgSrc" title="" />
    <img v-for="item in data.distributions" :key="item.id" class="img-svg" :src="item.svgUrl" title="" />
  </div>
</template>

<style lang="scss">
// todo move to scss file
.asset-image__meta-icons {
  position: absolute;
  left: 6px;
  top: 163px;
  padding: 2px;
  background-color: rgba(204, 204, 204, 0.5);
  border-radius: 4px;
  display: flex;

  img.img-svg {
    height: 30px;
  }
}
</style>
