import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'
import { ENTITY } from '@/domains/coreDam/assetListView/api/assetListViewApi'

export function useAssetListViewFactory() {
  const createDefault = (): AssetListView => {
    return {
      id: 0,
      name: '',
      extSystem: null,
      position: 0,
      groups: [],
      licences: [],
      types: [],
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
