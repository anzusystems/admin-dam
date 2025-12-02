import {
  LinkVariant,
  LinkVariantDefault,
  type LinkVariantType,
} from '@/components/anzutap/marks/link/composables/LinkVariant'
import { isUndefined, useSentry } from '@anzusystems/common-admin'

export function isValidLinkVariant(value: unknown): value is LinkVariantType {
  return (
    typeof value === 'string' &&
    (value === LinkVariant.Link)
  )
}

export function validateLinkVariant(
  value: unknown,
  defaultValue: LinkVariantType = LinkVariantDefault
): LinkVariantType {
  if (isUndefined(value)) {
    return defaultValue
  }
  if (isValidLinkVariant(value)) {
    return value
  }

  const { logMessage } = useSentry()
  logMessage('anzutap_link_variant', 'error', {
    tags: {
      error_type: 'anzutap_mark_error',
    },
    extra: {
      value,
    },
  })

  return defaultValue
}
