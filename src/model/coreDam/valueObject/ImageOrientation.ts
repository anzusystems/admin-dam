import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const ImageOrientation = {
  Landscape: 'L',
  Portrait: 'P',
  Square: 'S',
} as const

export type ImageOrientationType = (typeof ImageOrientation)[keyof typeof ImageOrientation]
export const ImageOrientationDefault = ImageOrientation.Landscape

export function useImageOrientation() {
  const { t } = useI18n()

  const imageOrientationOptions = ref<ValueObjectOption<ImageOrientationType>[]>([
    {
      value: ImageOrientation.Landscape,
      title: t('coreDam.asset.imageOrientation.landscape'),
    },
    {
      value: ImageOrientation.Portrait,
      title: t('coreDam.asset.imageOrientation.portrait'),
    },
    {
      value: ImageOrientation.Square,
      title: t('coreDam.asset.imageOrientation.square'),
    },
  ])

  const getImageOrientationOption = (value: ImageOrientationType) => {
    return imageOrientationOptions.value.find((item) => item.value === value)
  }

  return {
    imageOrientationOptions,
    getImageOrientationOption,
  }
}
