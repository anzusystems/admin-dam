<script lang="ts" setup>
import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { AssetFileProperties } from '@/types/coreDam/Asset'
import { computed } from 'vue'
import {
  DIMENSIONS_CONFIG,
  ICON_LOW,
  ICON_RSS,
  ICON_SLOTS,
  LOW_DIMENSION,
} from '@/views/coreDam/asset/components/assetImageIconsConfig'
import { damConfig } from '@/services/DamConfigService'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    assetType: AssetType
    assetFileProperties: AssetFileProperties
  }>(),
  {}
)

const { t } = useI18n()

const checkDimensions = (icons: string[], titles: string[]) => {
  if (props.assetFileProperties.width === 0 || props.assetFileProperties.height === 0) {
    return
  }
  if (props.assetFileProperties.width < LOW_DIMENSION || props.assetFileProperties.height < LOW_DIMENSION) {
    icons.push(ICON_LOW)
    titles.push(t('coreDam.asset.metaIcons.low'))
    return
  }
  if (props.assetType !== AssetType.Video) return
  for (let i = 0; i < DIMENSIONS_CONFIG.length; i++) {
    if (
      props.assetFileProperties.width === DIMENSIONS_CONFIG[i].width &&
      props.assetFileProperties.height === DIMENSIONS_CONFIG[i].height
    ) {
      icons.push(DIMENSIONS_CONFIG[i].svgSrc)
      titles.push(t(DIMENSIONS_CONFIG[i].titleT))
      break
    }
  }
}

const checkDistributions = (icons: string[], titles: string[]) => {
  for (let i = 0; i < props.assetFileProperties.distributesInServices.length; i++) {
    const iconPath = damConfig.distributionServices[props.assetFileProperties.distributesInServices[i]]?.iconPath
    if (iconPath.length > 0 && !icons.includes(iconPath)) {
      icons.push(iconPath)
      titles.push(damConfig.distributionServices[props.assetFileProperties.distributesInServices[i]].title)
    }
  }
}

const data = computed(() => {
  const icons: string[] = []
  const titles: string[] = []

  if (props.assetFileProperties.slotNames.length > 1) {
    icons.push(ICON_SLOTS)
    titles.push(t('coreDam.asset.metaIcons.slots'))
  }
  if (props.assetFileProperties.fromRss) {
    icons.push(ICON_RSS)
    titles.push(t('coreDam.asset.metaIcons.rss'))
  }
  checkDimensions(icons, titles)
  checkDistributions(icons, titles)

  return { icons, titles }
})
</script>

<template>
  <div v-show="data.icons.length > 0" class="asset-image__meta-icons">
    <img
      v-for="(item, index) in data.icons"
      :key="item"
      class="img-svg"
      :src="item"
      alt=""
      :title="data.titles[index] || ''"
    />
  </div>
</template>

<style lang="scss">
.asset-image__meta-icons {
  position: absolute;
  left: 6px;
  top: 163px;
  display: flex;

  img.img-svg {
    height: 30px;
    padding: 2px;
  }
}
</style>
