import { computed, readonly, ref } from 'vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'

const HEIGHT_MINIMAL = 32
const HEIGHT_COMPACT = 160
const HEIGHT_FULL = 0
const HEIGHT_HIDDEN = 0

export enum FooterViewSelected {
  Hidden = 'hidden',
  Minimal = 'minimal',
  Compact = 'compact',
  Full = 'full',
}

const { customFooterHeight, customDialog } = useMainWrapper()

const getFooterViewSelectedHeight = (value: FooterViewSelected) => {
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

const footerViewSelected = ref<FooterViewSelected>(FooterViewSelected.Hidden)

export function useAssetFooterSelectedView() {
  const setFooterViewSelected = (value: FooterViewSelected) => {
    footerViewSelected.value = value
    customFooterHeight.value = getFooterViewSelectedHeight(footerViewSelected.value)
  }

  const autoShowSelected = () => {
    if (footerViewSelected.value === FooterViewSelected.Hidden) {
      setFooterViewSelected(FooterViewSelected.Compact)
    }
  }

  const hideSelected = () => {
    setFooterViewSelected(FooterViewSelected.Hidden)
    customDialog.value = false
  }

  const showMinimalSelected = computed(() => {
    return footerViewSelected.value !== FooterViewSelected.Minimal
  })

  const setMinimalSelected = () => {
    // if (footerViewUploadContainsItems.value && footerViewUpload.value === FooterViewUpload.Hidden) {
    //   footerViewUpload.value = FooterViewUpload.Minimal
    // }
    setFooterViewSelected(FooterViewSelected.Minimal)
    customDialog.value = false
  }

  const showFullSelected = computed(() => {
    return footerViewSelected.value !== FooterViewSelected.Full
  })

  const setFullSelected = () => {
    // if (footerViewUpload.value !== FooterViewUpload.Hidden) {
    //   setFooterViewUpload(FooterViewUpload.Hidden)
    // }
    setFooterViewSelected(FooterViewSelected.Full)
    customDialog.value = true
  }

  const showCompactSelected = computed(() => {
    return footerViewSelected.value !== FooterViewSelected.Compact
  })

  const setCompactSelected = () => {
    // if (footerViewUploadContainsItems.value && footerViewUpload.value === FooterViewUpload.Hidden) {
    //   footerViewUpload.value = FooterViewUpload.Minimal
    // }
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
