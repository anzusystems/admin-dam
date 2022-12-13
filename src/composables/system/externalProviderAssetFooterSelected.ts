import { computed, readonly, ref } from 'vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'

const HEIGHT_MINIMAL = 32
const HEIGHT_COMPACT = 160
const HEIGHT_FULL = 0
const HEIGHT_HIDDEN = 0

export enum ExternalProviderFooterViewSelected {
  Hidden = 'hidden',
  Minimal = 'minimal',
  Compact = 'compact',
  Full = 'full',
}

const { customFooterHeight, customDialog } = useMainWrapper()

const getExternalProviderFooterViewSelectedHeight = (value: ExternalProviderFooterViewSelected) => {
  switch (value) {
    case ExternalProviderFooterViewSelected.Compact:
      return HEIGHT_COMPACT
    case ExternalProviderFooterViewSelected.Minimal:
      return HEIGHT_MINIMAL
    case ExternalProviderFooterViewSelected.Full:
      return HEIGHT_FULL
    default:
      return HEIGHT_HIDDEN
  }
}

const externalProviderFooterViewSelected = ref<ExternalProviderFooterViewSelected>(
  ExternalProviderFooterViewSelected.Hidden
)

export function useExternalProviderAssetFooterSelectedView() {
  const setExternalProviderFooterViewSelected = (value: ExternalProviderFooterViewSelected) => {
    externalProviderFooterViewSelected.value = value
    customFooterHeight.value = getExternalProviderFooterViewSelectedHeight(externalProviderFooterViewSelected.value)
  }

  const autoShowSelected = () => {
    if (externalProviderFooterViewSelected.value === ExternalProviderFooterViewSelected.Hidden) {
      setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Compact)
    }
  }

  const hideSelected = () => {
    setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Hidden)
    customDialog.value = false
  }

  const showMinimalSelected = computed(() => {
    return externalProviderFooterViewSelected.value !== ExternalProviderFooterViewSelected.Minimal
  })

  const setMinimalSelected = () => {
    setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Minimal)
    customDialog.value = false
  }

  const showFullSelected = computed(() => {
    return externalProviderFooterViewSelected.value !== ExternalProviderFooterViewSelected.Full
  })

  const setFullSelected = () => {
    setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Full)
    customDialog.value = true
  }

  const showCompactSelected = computed(() => {
    return externalProviderFooterViewSelected.value !== ExternalProviderFooterViewSelected.Compact
  })

  const setCompactSelected = () => {
    setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Compact)
    customDialog.value = false
  }

  return {
    externalProviderFooterViewSelected: readonly(externalProviderFooterViewSelected),
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
