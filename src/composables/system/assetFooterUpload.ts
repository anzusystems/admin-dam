import { computed, readonly, ref } from 'vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'

export enum FooterViewUpload {
  Hidden = 'hidden',
  Minimal = 'minimal',
  Compact = 'compact',
  Full = 'full',
}

const { customDialog } = useMainWrapper()

const footerViewUpload = ref<FooterViewUpload>(FooterViewUpload.Hidden)

export function useAssetFooterUploadView() {
  const assetListStore = useAssetListStore()

  const setFooterViewUpload = (value: FooterViewUpload) => {
    footerViewUpload.value = value
  }

  const autoShowUpload = () => {
    if (footerViewUpload.value === FooterViewUpload.Hidden) {
      setFooterViewUpload(FooterViewUpload.Compact)
    }
  }

  const hideUpload = () => {
    assetListStore.keyboardNavigationEnable()
    setFooterViewUpload(FooterViewUpload.Hidden)
    customDialog.value = false
  }

  const showMinimalUpload = computed(() => {
    return footerViewUpload.value !== FooterViewUpload.Minimal
  })

  const setMinimalUpload = () => {
    assetListStore.keyboardNavigationEnable()
    setFooterViewUpload(FooterViewUpload.Minimal)
    customDialog.value = false
  }

  const showFullUpload = computed(() => {
    return footerViewUpload.value !== FooterViewUpload.Full
  })

  const setFullUpload = () => {
    assetListStore.keyboardNavigationDisable()
    setFooterViewUpload(FooterViewUpload.Full)
    customDialog.value = true
  }

  const showCompactUpload = computed(() => {
    return footerViewUpload.value !== FooterViewUpload.Compact
  })

  const setCompactUpload = () => {
    assetListStore.keyboardNavigationEnable()
    setFooterViewUpload(FooterViewUpload.Compact)
    customDialog.value = false
  }

  return {
    footerViewUpload: readonly(footerViewUpload),
    showMinimalUpload,
    autoShowUpload,
    hideUpload,
    setMinimalUpload,
    showFullUpload,
    setFullUpload,
    showCompactUpload,
    setCompactUpload,
  }
}
