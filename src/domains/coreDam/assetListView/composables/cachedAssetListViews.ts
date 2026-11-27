import type { DamAssetListViewMinimal, IntegerId } from '@anzusystems/common-admin'
import { defineCached, fetchDamAssetListViewListByIds } from '@anzusystems/common-admin'

import { damClient } from '@/shared/apiClients/damClient'

const mapFullToMinimal = (listView: DamAssetListViewMinimal): DamAssetListViewMinimal => ({
  id: listView.id,
  name: listView.name,
})

const mapIdToMinimal = (id: IntegerId): DamAssetListViewMinimal => ({ id, name: '' })

const { cache, fetch, add, addManual, has, get, isLoaded } = defineCached<
  IntegerId,
  DamAssetListViewMinimal,
  DamAssetListViewMinimal
>(mapFullToMinimal, mapIdToMinimal, (ids: IntegerId[]) => fetchDamAssetListViewListByIds(damClient, ids))

export const useCachedAssetListViews = () => ({
  addManualToCachedAssetListViews: addManual,
  addToCachedAssetListViews: add,
  fetchCachedAssetListViews: fetch,
  cachedAssetListViews: cache,
  hasCachedAssetListView: has,
  getCachedAssetListView: get,
  isLoadedCachedAssetListView: isLoaded,
})
