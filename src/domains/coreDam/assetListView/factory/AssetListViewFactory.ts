import { dateTimeNow } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/assetListView/api/assetListViewApi'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function useAssetListViewFactory() {
  const createDefault = (): AssetListView => ({
    id: 0,
    name: '',
    extSystem: null,
    position: 0,
    groups: [],
    licences: [],
    uploadLicence: null,
    createdAt: dateTimeNow(),
    modifiedAt: dateTimeNow(),
    createdBy: 0,
    modifiedBy: 0,
    _resourceName: ENTITY,
    _system: SYSTEM_CORE_DAM,
  })

  return {
    createDefault,
  }
}
