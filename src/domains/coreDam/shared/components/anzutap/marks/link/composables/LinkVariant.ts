export const LinkVariant = {
  Link: 'link',
} as const
export const LinkVariantDefault = LinkVariant.Link
export type LinkVariantType = (typeof LinkVariant)[keyof typeof LinkVariant]
