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

  /* The view over the whole page, and the keys of the list under it, are the upload's to give back only while it holds
   * them: the answer of its "save and finish" can come once it was put away, and a selection may be drawn over the
   * page by then. */
  const hideUpload = () => {
    if (footerViewUpload.value === FooterViewUpload.Full) {
      assetListStore.keyboardNavigationEnable()
      customDialog.value = false
    }
    setFooterViewUpload(FooterViewUpload.Hidden)
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
