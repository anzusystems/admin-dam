<script lang="ts" setup>
import {
  DIMENSIONS_CONFIG,
  ICON_LOW,
  ICON_RSS,
  ICON_SLOTS,
  ICON_TTS,
  LOW_DIMENSION,
} from '@/domains/coreDam/asset/components/assetImageIconsConfig'
import { useAssetAutoDelete } from '@/domains/coreDam/asset/composables/assetAutoDelete'
import {
  type AssetFileProperties,
  DamAssetType,
  type DamAssetTypeType,
  dateTimeFriendly,
  useDamConfigStore,
  useRemainingTime,
} from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
    assetFileProperties: AssetFileProperties
    disableAbsolute?: boolean
    licenceBadge?: string
    singleUse?: boolean
    autoDeleteAt?: Date | null
  }>(),
  {
    disableAbsolute: false,
    licenceBadge: '',
    singleUse: false,
    autoDeleteAt: null,
  }
)

const { t } = useI18n()
const { remainingTimeShort } = useRemainingTime()
const { remainingSeconds } = useAssetAutoDelete()

const autoDeleteBadge = computed(() => {
  if (!props.autoDeleteAt) return null
  return {
    text: remainingTimeShort(remainingSeconds(props.autoDeleteAt)),
    title: t('coreDam.asset.metaIcons.autoDeleteAt', { date: dateTimeFriendly(props.autoDeleteAt.toISOString()) }),
  }
})

const checkDimensions = (icons: string[], titles: string[]) => {
  if (props.assetFileProperties.width === 0 || props.assetFileProperties.height === 0) {
    return
  }
  if (props.assetFileProperties.width < LOW_DIMENSION || props.assetFileProperties.height < LOW_DIMENSION) {
    icons.push(ICON_LOW)
    titles.push(t('coreDam.asset.metaIcons.low'))
    return
  }
  if (props.assetType !== DamAssetType.Video) return
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
  const damConfigStore = useDamConfigStore()
  const { damPrvConfig } = storeToRefs(damConfigStore)
  for (let i = 0; i < props.assetFileProperties.distributesInServices.length; i++) {
    const iconPath =
      damPrvConfig.value.distributionServices[props.assetFileProperties.distributesInServices[i]]?.iconPath
    if (isDefined(iconPath) && iconPath.length > 0 && !icons.includes(iconPath)) {
      icons.push(iconPath)
      titles.push(damPrvConfig.value.distributionServices[props.assetFileProperties.distributesInServices[i]].title)
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
  if (props.assetFileProperties.ttsAudio) {
    icons.push(ICON_TTS)
    titles.push(t('coreDam.asset.metaIcons.tts'))
  }
  checkDimensions(icons, titles)
  checkDistributions(icons, titles)

  return { icons, titles }
})
</script>

<template>
  <div
    v-show="data.icons.length > 0 || licenceBadge.length > 0 || singleUse || autoDeleteBadge"
    class="asset-image__meta-icons"
    :class="{ 'asset-image__meta-icons-absolute': !disableAbsolute }"
  >
    <span
      v-if="licenceBadge.length > 0"
      class="asset-image__licence-badge"
      data-cy="asset-licence-badge"
    >
      {{ licenceBadge }}
    </span>
    <span
      v-if="singleUse"
      class="asset-image__licence-badge"
      :title="t('coreDam.asset.metaIcons.singleUse')"
      data-cy="asset-single-use-badge"
    >
      1×
    </span>
    <span
      v-if="autoDeleteBadge"
      class="asset-image__licence-badge asset-image__licence-badge--wide"
      :title="autoDeleteBadge.title"
      data-cy="asset-auto-delete-badge"
    >
      {{ autoDeleteBadge.text }}
    </span>
    <img
      v-for="(item, index) in data.icons"
      :key="item"
      class="img-svg"
      :src="item"
      alt=""
      :title="data.titles[index] || ''"
    >
  </div>
</template>

<style lang="scss">
.asset-image__meta-icons-absolute {
  position: absolute;
  left: 6px;
  top: 163px;
}

.asset-image__meta-icons {
  display: flex;

  img.img-svg {
    height: 30px;
    padding: 2px;
  }

  // Same look as the SVG meta icons (low.svg): half-transparent black circle with white bold letters.
  .asset-image__licence-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin: 2px;
    border-radius: 50%;
    background-color: rgb(0 0 0 / 50%);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
  }

  .asset-image__licence-badge--wide {
    width: auto;
    padding: 0 8px;
    border-radius: 13px;
    white-space: nowrap;
  }
}
</style>
