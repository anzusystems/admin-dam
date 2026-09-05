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

// Registered from the router guard, outside any effect scope, so the `off` handle is the only way
// to unregister. The bus dedupes by identity and every run passes a fresh closure.
let removeAppNotificationListener: (() => void) | null = null

export const initAppNotificationListeners = () => {
  if (removeAppNotificationListener) return

  const { openConnection } = initDamNotifications()
  const { addDamNotificationListener } = useDamNotifications()

  const uploadQueuesStore = useUploadQueuesStore()
  const distributionListStore = useDistributionListStore()

  const off = addDamNotificationListener((event) => {
    switch (event.name) {
      case DamNotificationName.AssetFileProcessed:
        uploadQueuesStore.queueItemProcessed(event.data.asset)
        break
      case DamNotificationName.AssetFileFailed:
        uploadQueuesStore.queueItemFailed(event.data.asset, event.data.failReason)
        break
      case DamNotificationName.AssetFileDuplicate:
        uploadQueuesStore.queueItemDuplicate(event.data.asset, event.data.originAssetFile, event.data.assetType)
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

export const destroyAppNotificationListeners = () => {
  removeAppNotificationListener?.()
  removeAppNotificationListener = null
}
