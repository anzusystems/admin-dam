import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum ImageOrientation {
  Landscape = 'L',
  Portrait = 'P',
  Square = 'S',
  Default = Landscape,
}

export function useImageOrientation() {
  const { t } = useI18n({ useScope: 'global' })

  const imageOrientationOptions = ref<ValueObjectOption<ImageOrientation>[]>([
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

  const getImageOrientationOption = (value: ImageOrientation) => {
    return imageOrientationOptions.value.find((item) => item.value === value)
  }

  return {
    imageOrientationOptions,
    getImageOrientationOption,
  }
}
