import { dateTimeNow, type DocId, type DocIdNullable } from '@anzusystems/common-admin'
import type { PodcastExportData } from '@/types/coreDam/PodcastExportData'
import { ExportTypeDefault } from '@/model/coreDam/valueObject/ExportType'
import { DeviceTypeDefault } from '@/model/coreDam/valueObject/DeviceType'
import { SYSTEM_CORE_DAM } from '@/model/systems'

const ENTITY = 'podcastExportData'

export function usePodcastExportDataFactory() {
  const createDefault = (podcastId: DocIdNullable = null): PodcastExportData => {
    return {
      id: 0,
      exportType: ExportTypeDefault,
      deviceType: DeviceTypeDefault,
      podcast: podcastId,
      body: {},
      position: 0,
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  const createDefaultWithPodcast = (podcastId: DocId): PodcastExportData => {
    return createDefault(podcastId)
  }

  return {
    createDefault,
    createDefaultWithPodcast,
  }
}
