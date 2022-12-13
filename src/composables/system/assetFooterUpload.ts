import { computed, readonly, ref } from 'vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'

export enum FooterViewUpload {
  Hidden = 'hidden',
  Minimal = 'minimal',
  Compact = 'compact',
  Full = 'full',
}

const { customDialog } = useMainWrapper()

const footerViewUpload = ref<FooterViewUpload>(FooterViewUpload.Hidden)
// const footerViewSelectedContainItems = ref(false)

export function useAssetFooterUploadView() {
  const setFooterViewUpload = (value: FooterViewUpload) => {
    footerViewUpload.value = value
  }

  const autoShowUpload = () => {
    if (footerViewUpload.value === FooterViewUpload.Hidden) {
      setFooterViewUpload(FooterViewUpload.Compact)
    }
  }

  const hideUpload = () => {
    setFooterViewUpload(FooterViewUpload.Hidden)
    customDialog.value = false
  }

  const showMinimalUpload = computed(() => {
    return footerViewUpload.value !== FooterViewUpload.Minimal
  })

  const setMinimalUpload = () => {
    // if (footerViewSelectedContainItems.value && footerViewSelected.value === FooterViewSelected.Hidden) {
    //   footerViewSelected.value = FooterViewSelected.Minimal
    // }
    setFooterViewUpload(FooterViewUpload.Minimal)
    customDialog.value = false
  }

  const showFullUpload = computed(() => {
    return footerViewUpload.value !== FooterViewUpload.Full
  })

  const setFullUpload = () => {
    // if (footerViewSelected.value !== FooterViewSelected.Hidden) {
    //   setFooterViewSelected(FooterViewSelected.Hidden)
    // }
    setFooterViewUpload(FooterViewUpload.Full)
    customDialog.value = true
  }

  const showCompactUpload = computed(() => {
    return footerViewUpload.value !== FooterViewUpload.Compact
  })

  const setCompactUpload = () => {
    // if (footerViewSelectedContainItems.value && footerViewSelected.value === FooterViewSelected.Hidden) {
    //   footerViewSelected.value = FooterViewSelected.Minimal
    // }
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
