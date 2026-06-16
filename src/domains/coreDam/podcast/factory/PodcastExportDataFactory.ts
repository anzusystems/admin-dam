import type { PodcastExportData } from '@/domains/coreDam/podcast/types/PodcastExportData'
import { ExportTypeDefault } from '@/domains/coreDam/asset/valueObject/ExportType'
import { DeviceTypeDefault } from '@/domains/coreDam/asset/valueObject/DeviceType'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { nextListEditorTempId } from '@anzusystems/common-admin/labs'

const ENTITY = 'podcastExportData'

export function usePodcastExportDataFactory() {
  const createDefault = (podcastId: DocIdNullable = null): PodcastExportData => {
    return {
      // Negative temp id gives new (unsaved) rows a unique list-editor key (real ids are positive).
      id: nextListEditorTempId(),
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
