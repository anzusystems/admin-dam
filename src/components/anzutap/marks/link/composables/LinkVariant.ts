import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const LinkVariant = {
  Link: 'link',
} as const
export const LinkVariantDefault = LinkVariant.Link
export type LinkVariantType = (typeof LinkVariant)[keyof typeof LinkVariant]

export function useLinkVariant() {
  const { t } = useI18n()

  const linkVariantOptions = ref<ValueObjectOption<LinkVariantType>[]>([
    {
      value: LinkVariant.Link,
      title: t('editor.mark.link.variant.link'),
    },
  ])

  const getLinkVariantOption = (value: LinkVariantType) => {
    return linkVariantOptions.value.find((item) => item.value === value)
  }

  return {
    linkVariantOptions,
    getLinkVariantOption,
  }
}
