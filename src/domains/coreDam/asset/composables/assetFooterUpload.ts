import { computed, readonly, ref } from 'vue'

import { useAssetListStore } from '@/domains/coreDam/asset/store/assetListStore'
import { useMainWrapper } from '@/domains/system/composables/useMainWrapper'

export const FooterViewUpload = {
  Hidden: 'hidden',
  Minimal: 'minimal',
  Compact: 'compact',
  Full: 'full',
} as const

export type FooterViewUploadType = (typeof FooterViewUpload)[keyof typeof FooterViewUpload]
export const FooterViewUploadDefault = FooterViewUpload.Hidden

const { customDialog } = useMainWrapper()

const footerViewUpload = ref<FooterViewUploadType>(FooterViewUploadDefault)

export function useAssetFooterUploadView() {
  const assetListStore = useAssetListStore()

  const setFooterViewUpload = (value: FooterViewUploadType) => {
    footerViewUpload.value = value
  }

  const autoShowUpload = () => {
    if (footerViewUpload.value === FooterViewUpload.Hidden) {
      setFooterViewUpload(FooterViewUpload.Compact)
    }
  }

  /*
   * The upload gives back the full-page view and list keys only while it holds them. Its
   * "save and finish" answer can come after it closed, when a selection may cover the page.
   */
  const hideUpload = () => {
    if (footerViewUpload.value === FooterViewUpload.Full) {
      assetListStore.keyboardNavigationEnable()
      customDialog.value = false
    }
    setFooterViewUpload(FooterViewUpload.Hidden)
  }

  const showMinimalUpload = computed(() => footerViewUpload.value !== FooterViewUpload.Minimal)

  const setMinimalUpload = () => {
    assetListStore.keyboardNavigationEnable()
    setFooterViewUpload(FooterViewUpload.Minimal)
    customDialog.value = false
  }

  const showFullUpload = computed(() => footerViewUpload.value !== FooterViewUpload.Full)

  const setFullUpload = () => {
    assetListStore.keyboardNavigationDisable()
    setFooterViewUpload(FooterViewUpload.Full)
    customDialog.value = true
  }

  const showCompactUpload = computed(() => footerViewUpload.value !== FooterViewUpload.Compact)

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
