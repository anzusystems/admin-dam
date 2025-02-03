import { computed, readonly, ref } from 'vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'

const HEIGHT_MINIMAL = 32
const HEIGHT_COMPACT = 160
const HEIGHT_FULL = 0
const HEIGHT_HIDDEN = 0

export const FooterViewSelected = {
  Hidden: 'hidden',
  Minimal: 'minimal',
  Compact: 'compact',
  Full: 'full',
} as const

export type FooterViewSelectedType = (typeof FooterViewSelected)[keyof typeof FooterViewSelected]
export const FooterViewSelectedDefault = FooterViewSelected.Hidden

const { customFooterHeight, customDialog } = useMainWrapper()

const getFooterViewSelectedHeight = (value: FooterViewSelectedType) => {
  switch (value) {
    case FooterViewSelected.Compact:
      return HEIGHT_COMPACT
    case FooterViewSelected.Minimal:
      return HEIGHT_MINIMAL
    case FooterViewSelected.Full:
      return HEIGHT_FULL
    default:
      return HEIGHT_HIDDEN
  }
}

const footerViewSelected = ref<FooterViewSelectedType>(FooterViewSelectedDefault)

export function useAssetFooterSelectedView() {
  const assetListStore = useAssetListStore()

  const setFooterViewSelected = (value: FooterViewSelectedType) => {
    footerViewSelected.value = value
    customFooterHeight.value = getFooterViewSelectedHeight(footerViewSelected.value)
  }

  const autoShowSelected = () => {
    if (footerViewSelected.value === FooterViewSelected.Hidden) {
      setFooterViewSelected(FooterViewSelected.Compact)
    }
  }

  const hideSelected = () => {
    assetListStore.keyboardNavigationEnable()
    setFooterViewSelected(FooterViewSelected.Hidden)
    customDialog.value = false
  }

  const showMinimalSelected = computed(() => {
    return footerViewSelected.value !== FooterViewSelected.Minimal
  })

  const setMinimalSelected = () => {
    assetListStore.keyboardNavigationEnable()
    setFooterViewSelected(FooterViewSelected.Minimal)
    customDialog.value = false
  }

  const showFullSelected = computed(() => {
    return footerViewSelected.value !== FooterViewSelected.Full
  })

  const setFullSelected = () => {
    assetListStore.keyboardNavigationDisable()
    setFooterViewSelected(FooterViewSelected.Full)
    customDialog.value = true
  }

  const showCompactSelected = computed(() => {
    return footerViewSelected.value !== FooterViewSelected.Compact
  })

  const setCompactSelected = () => {
    assetListStore.keyboardNavigationEnable()
    setFooterViewSelected(FooterViewSelected.Compact)
    customDialog.value = false
  }

  return {
    footerViewSelected: readonly(footerViewSelected),
    autoShowSelected,
    hideSelected,
    showMinimalSelected,
    setMinimalSelected,
    showFullSelected,
    setFullSelected,
    showCompactSelected,
    setCompactSelected,
  }
}
