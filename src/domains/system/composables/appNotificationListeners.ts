import {
  AssetFileProcessStatus,
  DamDistributionStatus,
  DamNotificationName,
  initDamNotifications,
  useDamNotifications,
} from '@anzusystems/common-admin'

import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import { useDistributionListStore } from '@/domains/coreDam/asset/store/distributionListStore'
import { useUploadQueuesStore } from '@/domains/coreDam/asset/store/uploadQueuesStore'
import { useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_DAM } from '@/shared/systems'

/*
 * Registered from the router guard, outside any effect scope, so nothing tears it down.
 * A failed `openConnection` removes the listener itself.
 */
let removeAppNotificationListener: (() => void) | null = null

export const initAppNotificationListeners = () => {
  if (removeAppNotificationListener) return

  const { openConnection } = initDamNotifications()
  const { addDamNotificationListener } = useDamNotifications()

  const uploadQueuesStore = useUploadQueuesStore()
  const assetDetailStore = useAssetDetailStore()
  const distributionListStore = useDistributionListStore()

  const off = addDamNotificationListener((event) => {
    switch (event.name) {
      // `data.id` is the asset file. Without it, two slot uploads of one asset settle each other.
      case DamNotificationName.AssetFileProcessed:
        uploadQueuesStore.queueItemProcessed(event.data.asset, event.data.id)
        // Also updates a detail or panel holding the asset with
        // this file still processing, with or without a queue row.
        assetDetailStore.fileStatusOnServer(event.data.asset, event.data.id, AssetFileProcessStatus.Processed)
        break
      case DamNotificationName.AssetFileFailed:
        uploadQueuesStore.queueItemFailed(event.data.asset, event.data.failReason, event.data.id)
        // Same as above: file processing has ended, but failed.
        assetDetailStore.fileStatusOnServer(event.data.asset, event.data.id, AssetFileProcessStatus.Failed)
        break
      case DamNotificationName.AssetFileDuplicate:
        uploadQueuesStore.queueItemDuplicate(
          event.data.asset,
          event.data.originAssetFile,
          event.data.assetType,
          event.data.id
        )
        assetDetailStore.fileStatusOnServer(event.data.asset, event.data.id, AssetFileProcessStatus.Duplicate)
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
