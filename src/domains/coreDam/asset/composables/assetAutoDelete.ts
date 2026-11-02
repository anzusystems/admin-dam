import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import type { DatetimeUTC, IntegerId } from '@anzusystems/common-admin'

const DAY_IN_MS = 86_400_000
const SECOND_IN_MS = 1_000
// Mirrors AssetLicenceAutoDelete::MIN_OLDER_THAN_DAYS in core-dam-bundle: the retention cron skips licences below it.
const MIN_OLDER_THAN_DAYS = 2

export const useAssetAutoDelete = () => {
  const { getCachedAssetLicence } = useCachedAssetLicences()

  const autoDeleteAt = (licenceId: IntegerId, createdAt: DatetimeUTC): Date | null => {
    const autoDelete = getCachedAssetLicence(licenceId)?.autoDelete
    if (!autoDelete || !autoDelete.active || autoDelete.olderThanDays < MIN_OLDER_THAN_DAYS) return null
    return new Date(new Date(createdAt).getTime() + autoDelete.olderThanDays * DAY_IN_MS)
  }

  const remainingSeconds = (date: Date): number => {
    return Math.max(0, Math.floor((date.getTime() - Date.now()) / SECOND_IN_MS))
  }

  return {
    autoDeleteAt,
    remainingSeconds,
  }
}
