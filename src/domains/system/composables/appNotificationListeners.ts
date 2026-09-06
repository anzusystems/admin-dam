import { useAuth } from '@/domains/system/auth/auth'
import { SYSTEM_DAM } from '@/shared/systems'
import { damClient } from '@/shared/apiClients/damClient'
import { useDistributionListStore } from '@/domains/coreDam/asset/store/distributionListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import {
  DamDistributionStatus,
  DamNotificationName,
  initDamNotifications,
  useDamNotifications,
} from '@anzusystems/common-admin'

/* Registered from the router guard, outside any effect scope: nothing tears this down for the life
 * of the document, so a failed `openConnection` takes the listener back off itself. */
let removeAppNotificationListener: (() => void) | null = null

export const initAppNotificationListeners = () => {
  if (removeAppNotificationListener) return

  const { openConnection } = initDamNotifications()
  const { addDamNotificationListener } = useDamNotifications()

  const uploadQueuesStore = useUploadQueuesStore()
  const distributionListStore = useDistributionListStore()

  const off = addDamNotificationListener((event) => {
    switch (event.name) {
      // `data.id` is the asset file: without it two slot uploads of one asset settle each other.
      case DamNotificationName.AssetFileProcessed:
        uploadQueuesStore.queueItemProcessed(event.data.asset, event.data.id)
        break
      case DamNotificationName.AssetFileFailed:
        uploadQueuesStore.queueItemFailed(event.data.asset, event.data.failReason, event.data.id)
        break
      case DamNotificationName.AssetFileDuplicate:
        uploadQueuesStore.queueItemDuplicate(
          event.data.asset,
          event.data.originAssetFile,
          event.data.assetType,
          event.data.id
        )
        break
      case DamNotificationName.AssetMetadataProcessed:
        uploadQueuesStore.queueItemMetadataProcessed(event.data.asset)
        break
      case DamNotificationName.DistributionDistributing:
        distributionListStore.listItemMessageUpdate(event.data.id, DamDistributionStatus.Distributing)
        break
      case DamNotificationName.DistributionRemoteProcessing:
        distributionListStore.listItemMessageUpdate(event.data.id, DamDistributionStatus.RemoteProcessing)
        break
      case DamNotificationName.DistributionDistributed:
        distributionListStore.listItemMessageUpdate(event.data.id, DamDistributionStatus.Distributed)
        break
      case DamNotificationName.DistributionFailed:
        distributionListStore.listItemMessageUpdate(event.data.id, DamDistributionStatus.Failed)
        break
      case DamNotificationName.DistributionAuthorized:
        distributionListStore.authorizationMessage(event.data.distributionService, event.data.success)
        break
      case DamNotificationName.UserUpdated: {
        const { useCurrentUser } = useAuth()
        const { fetchCurrentUser } = useCurrentUser(SYSTEM_DAM)
        fetchCurrentUser(damClient, '/adm/users/current')
        break
      }
    }
  })

  try {
    openConnection()
    removeAppNotificationListener = off
  } catch (error) {
    off()
    throw error
  }
}
