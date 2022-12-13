import { useNotification } from '@/composables/system/notifications'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { updateCurrentUser } from '@/composables/system/currentUser'
import { useDistributionListStore } from '@/stores/dam/distributionListStore'
import { DistributionStatus } from '@/model/dam/valueObject/DistributionStatus'

export const initAppNotificationListeners = () => {
  const { openConnection, addNotificationListener } = useNotification()
  openConnection()

  // Asset
  const uploadQueuesStore = useUploadQueuesStore()
  addNotificationListener('asset_file_processed', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      uploadQueuesStore.queueItemProcessed(message.detail.asset)
    }
  })
  addNotificationListener('asset_file_duplicate', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      uploadQueuesStore.queueItemDuplicate(
        message.detail.asset,
        message.detail.originAssetFile,
        message.detail.assetType
      )
    }
  })
  addNotificationListener('asset_metadata_processed', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      uploadQueuesStore.queueItemMetadataProcessed(message.detail.asset)
    }
  })

  // Distribution
  const distributionListStore = useDistributionListStore()
  addNotificationListener('distribution_distributing', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      distributionListStore.listItemMessageUpdate(message.detail.id, DistributionStatus.Distributing)
    }
  })
  addNotificationListener('distribution_remote_processing', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      distributionListStore.listItemMessageUpdate(message.detail.id, DistributionStatus.RemoteProcessing)
    }
  })
  addNotificationListener('distribution_distributed', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      distributionListStore.listItemMessageUpdate(message.detail.id, DistributionStatus.Distributed)
    }
  })
  addNotificationListener('distribution_failed', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      distributionListStore.listItemMessageUpdate(message.detail.id, DistributionStatus.Failed)
    }
  })
  addNotificationListener('distribution_authorized', (message: Event) => {
    if (message instanceof CustomEvent) {
      console.log(message.detail)
      distributionListStore.authorizationMessage(message.detail.distributionService, message.detail.success)
    }
  })

  // User
  addNotificationListener('user_updated', () => {
    updateCurrentUser()
  })
}
