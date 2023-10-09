// todo will be removed once rename key => property will be implemented

import type {
  DamConfigAssetCustomFormElement,
  DamConfigAssetCustomFormElementTemp
} from '@/types/coreDam/DamConfigAssetCustomForm'
import { isDefined } from '@anzusystems/common-admin'

export function mapElementsWithKeyToProperty
(items: Array<DamConfigAssetCustomFormElementTemp>
): Array<DamConfigAssetCustomFormElement> {
  return items.map(item => {
    return {
      id: item.id,
      property: isDefined(item.property) ? item.property as string : item.key as string,
      name: item.name,
      position: item.position,
      attributes: item.attributes,
      createdAt: item.createdAt,
      modifiedAt: item.modifiedAt,
      createdBy: item.createdBy,
      modifiedBy: item.modifiedBy,
      _system: item._system,
      _resourceName: item._resourceName,
    }
  })

}
