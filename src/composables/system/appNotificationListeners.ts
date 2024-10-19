import { useAuth } from '@/composables/auth/auth'
import { SYSTEM_DAM } from '@/model/systems'
import { damClient } from '@/services/api/clients/damClient'
import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import {
  DamDistributionStatus,
  DamNotificationName,
  initDamNotifications,
  useDamNotifications,
} from '@anzusystems/common-admin'

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
      case DamNotificationName.UserUpdated: {
        const { useCurrentUser } = useAuth()
        const { fetchCurrentUser } = useCurrentUser(SYSTEM_DAM)
        fetchCurrentUser(damClient, '/adm/users/current')
        break
      }
    }
  })
}
