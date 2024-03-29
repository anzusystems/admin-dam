import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import {
  DamDistributionStatus,
  DamNotificationName,
  initDamNotifications,
  updateDamCurrentUser,
  useDamNotifications,
} from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

export const initAppNotificationListeners = () => {
  const { openConnection } = initDamNotifications()
  const { addDamNotificationListener } = useDamNotifications()
  openConnection()

  const uploadQueuesStore = useUploadQueuesStore()
  const distributionListStore = useDistributionListStore()

  addDamNotificationListener((event) => {
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
      case DamNotificationName.UserUpdated:
        updateDamCurrentUser(damClient)
        break
    }
  })
}
