import type { LinkVariantType } from '@/components/anzutap/marks/link/composables/LinkVariant'
import { LinkVariant, LinkVariantDefault } from '@/components/anzutap/marks/link/composables/LinkVariant'
import { isString } from '@anzusystems/common-admin'

export const getVariantFromHref = (href: string | null | undefined): LinkVariantType => {
  if (!href || !isString(href)) {
    return LinkVariantDefault
  }
  const trimmedHref = href.trim()
  if (trimmedHref.startsWith('http://') || trimmedHref.startsWith('https://') || trimmedHref.startsWith('ftp://')) {
    return LinkVariant.Link
  }
  if (trimmedHref.includes('.') && !trimmedHref.startsWith('#')) {
    return LinkVariant.Link
  }
  return LinkVariantDefault
}

export const getLinkMarkAttributesFromHref = (href: string) => {
  const attrs = {
    href: href.trim(),
    variant: LinkVariantDefault as LinkVariantType,
    external: false,
    nofollow: false,
  }
  attrs.variant = getVariantFromHref(href)

  return attrs
}
