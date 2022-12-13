import { ref } from 'vue'
import { useAddToLazyHelper, useAllHelper } from '@/composables/system/lazyFetchHelpers'
import type { AssetLicence, AssetLicenceMinimal } from '@/types/dam/AssetLicence'
import { fetchAssetLicenceListByIds } from '@/services/api/dam/assetLicenceApi'

const all = ref<Map<number, AssetLicenceMinimal>>(new Map())
const allIds = ref<Set<number>>(new Set([]))

const mapToMinimal = (source: AssetLicence): AssetLicenceMinimal => {
  return { id: source.id, name: source.name }
}

export function loadLazyAssetLicence(forceRefresh = false) {
  const { fetchByIds, addToLazy } = useAddToLazyHelper<AssetLicence, AssetLicenceMinimal>()

  const fetchLazyAssetLicence = () => fetchByIds(all, forceRefresh, mapToMinimal, fetchAssetLicenceListByIds)

  const addToLazyAssetLicenceBuffer = (id: number) => {
    allIds.value.add(id)
    return addToLazy(id)
  }

  return {
    addToLazyAssetLicenceBuffer,
    fetchLazyAssetLicence,
  }
}

export function useLazyAssetLicence() {
  return useAllHelper<AssetLicenceMinimal>(all, allIds)
}
