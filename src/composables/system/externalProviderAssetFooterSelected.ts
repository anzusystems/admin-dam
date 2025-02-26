import { computed, readonly, ref } from 'vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useExternalProviderAssetListStore } from '@/stores/coreDam/externalProviderAssetListStore'

const HEIGHT_MINIMAL = 32
const HEIGHT_COMPACT = 160
const HEIGHT_FULL = 0
const HEIGHT_HIDDEN = 0

export const ExternalProviderFooterViewSelected = {
  Hidden: 'hidden',
  Minimal: 'minimal',
  Compact: 'compact',
  Full: 'full',
} as const

export type ExternalProviderFooterViewSelectedType =
  (typeof ExternalProviderFooterViewSelected)[keyof typeof ExternalProviderFooterViewSelected]
export const ExternalProviderFooterViewSelectedDefault = ExternalProviderFooterViewSelected.Hidden

const { customFooterHeight, customDialog } = useMainWrapper()

const getExternalProviderFooterViewSelectedHeight = (value: ExternalProviderFooterViewSelectedType) => {
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

const externalProviderFooterViewSelected = ref<ExternalProviderFooterViewSelectedType>(
  ExternalProviderFooterViewSelectedDefault
)

export function useExternalProviderAssetFooterSelectedView() {
  const externalProviderAssetListStore = useExternalProviderAssetListStore()

  const setExternalProviderFooterViewSelected = (value: ExternalProviderFooterViewSelectedType) => {
    externalProviderFooterViewSelected.value = value
    customFooterHeight.value = getExternalProviderFooterViewSelectedHeight(externalProviderFooterViewSelected.value)
  }

  const autoShowSelected = () => {
    if (externalProviderFooterViewSelected.value === ExternalProviderFooterViewSelected.Hidden) {
      setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Compact)
    }
  }

  const hideSelected = () => {
    externalProviderAssetListStore.keyboardNavigationEnable()
    setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Hidden)
    customDialog.value = false
  }

  const showMinimalSelected = computed(() => {
    return externalProviderFooterViewSelected.value !== ExternalProviderFooterViewSelected.Minimal
  })

  const setMinimalSelected = () => {
    externalProviderAssetListStore.keyboardNavigationEnable()
    setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Minimal)
    customDialog.value = false
  }

  const showFullSelected = computed(() => {
    return externalProviderFooterViewSelected.value !== ExternalProviderFooterViewSelected.Full
  })

  const setFullSelected = () => {
    externalProviderAssetListStore.keyboardNavigationDisable()
    setExternalProviderFooterViewSelected(ExternalProviderFooterViewSelected.Full)
    customDialog.value = true
  }

  const showCompactSelected = computed(() => {
    return externalProviderFooterViewSelected.value !== ExternalProviderFooterViewSelected.Compact
  })

  const setCompactSelected = () => {
    externalProviderAssetListStore.keyboardNavigationEnable()
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
