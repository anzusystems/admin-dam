import { computed, readonly, ref } from 'vue'
import { useMainWrapper } from '@/composables/wrappers/useMainWrapper'

export enum FooterViewUploadSlots {
  Hidden = 'hidden',
  Minimal = 'minimal',
  Compact = 'compact',
}

const { customDialog } = useMainWrapper()

const footerViewUploadSlots = ref<FooterViewUploadSlots>(FooterViewUploadSlots.Hidden)

export function useAssetFooterUploadSlotsView() {
  const setFooterViewUploadSlots = (value: FooterViewUploadSlots) => {
    footerViewUploadSlots.value = value
  }

  const autoShowUpload = () => {
    if (footerViewUploadSlots.value === FooterViewUploadSlots.Hidden) {
      setFooterViewUploadSlots(FooterViewUploadSlots.Compact)
    }
  }

  const hideUpload = () => {
    setFooterViewUploadSlots(FooterViewUploadSlots.Hidden)
    customDialog.value = false
  }

  const showMinimalUpload = computed(() => {
    return footerViewUploadSlots.value !== FooterViewUploadSlots.Minimal
  })

  const setMinimalUpload = () => {
    setFooterViewUploadSlots(FooterViewUploadSlots.Minimal)
    customDialog.value = false
  }

  const showCompactUpload = computed(() => {
    return footerViewUploadSlots.value !== FooterViewUploadSlots.Compact
  })

  const setCompactUpload = () => {
    setFooterViewUploadSlots(FooterViewUploadSlots.Compact)
    customDialog.value = false
  }

  return {
    footerViewUploadSlots: readonly(footerViewUploadSlots),
    showMinimalUpload,
    autoShowUpload,
    hideUpload,
    setMinimalUpload,
    showCompactUpload,
    setCompactUpload,
  }
}
