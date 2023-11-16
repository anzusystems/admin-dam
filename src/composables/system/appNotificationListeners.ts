import { useNotification } from '@/composables/system/notifications'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { updateCurrentUser } from '@/composables/system/currentUser'
import { useDistributionListStore } from '@/stores/coreDam/distributionListStore'
import { DamDistributionStatus } from '@anzusystems/common-admin'

export const initAppNotificationListeners = () => {
  const { openConnection, addNotificationListener } = useNotification()
  openConnection()

  // Asset
  const uploadQueuesStore = useUploadQueuesStore()
  addNotificationListener('asset_file_processed', (message: Event) => {
    if (message instanceof CustomEvent) {
      uploadQueuesStore.queueItemProcessed(message.detail.asset)
    }
  })
  addNotificationListener('asset_file_failed', (message: Event) => {
    if (message instanceof CustomEvent<unknown>) {
      uploadQueuesStore.queueItemFailed(message.detail.asset, message.detail.failReason)
    }
  })
  addNotificationListener('asset_file_duplicate', (message: Event) => {
    if (message instanceof CustomEvent) {
      uploadQueuesStore.queueItemDuplicate(
        message.detail.asset,
        message.detail.originAssetFile,
        message.detail.assetType
      )
    }
  })
  addNotificationListener('asset_metadata_processed', (message: Event) => {
    if (message instanceof CustomEvent) {
      uploadQueuesStore.queueItemMetadataProcessed(message.detail.asset)
    }
  })

  // Distribution
  const distributionListStore = useDistributionListStore()
  addNotificationListener('distribution_distributing', (message: Event) => {
    if (message instanceof CustomEvent) {
      distributionListStore.listItemMessageUpdate(message.detail.id, DamDistributionStatus.Distributing)
    }
  })
  addNotificationListener('distribution_remote_processing', (message: Event) => {
    if (message instanceof CustomEvent) {
      distributionListStore.listItemMessageUpdate(message.detail.id, DamDistributionStatus.RemoteProcessing)
    }
  })
  addNotificationListener('distribution_distributed', (message: Event) => {
    if (message instanceof CustomEvent) {
      distributionListStore.listItemMessageUpdate(message.detail.id, DamDistributionStatus.Distributed)
    }
  })
  addNotificationListener('distribution_failed', (message: Event) => {
    if (message instanceof CustomEvent) {
      distributionListStore.listItemMessageUpdate(message.detail.id, DamDistributionStatus.Failed)
    }
  })
  addNotificationListener('distribution_authorized', (message: Event) => {
    if (message instanceof CustomEvent) {
      distributionListStore.authorizationMessage(message.detail.distributionService, message.detail.success)
    }
  })

  // User
  addNotificationListener('user_updated', () => {
    updateCurrentUser()
  })
}
