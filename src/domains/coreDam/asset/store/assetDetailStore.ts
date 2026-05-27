import { type AssetDetailItemDto, DamAssetStatus, useAssetSuggestions } from '@anzusystems/common-admin'
import { useCachedAuthors } from '@/domains/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/domains/coreDam/keyword/composables/cachedKeywords'

export const useAssetDetailStore = defineStore('damAssetDetailStore', () => {
  const asset = ref<AssetDetailItemDto | null>(null)
  const authorConflicts = ref<DocId[]>([])
  const loader = ref(false)
  const siblingLoader = ref(false)
  const detail = ref(false)
  const view = ref<'list' | 'queue'>('list')
  const metadataAreTouched = ref(false)
  const directDetailLoad = ref(false)
  const lastFetched = ref(Date.now())
  const lastFetchedId = ref<DocId>('')
  const mainFileSingleUse = ref(false)

  function updateLastFetched(id: DocId) {
    lastFetchedId.value = id
    lastFetched.value = Date.now()
  }

  function showDetail() {
    detail.value = true
  }

  function hideDetail() {
    detail.value = false
  }

  function showLoader() {
    loader.value = true
  }

  function hideLoader() {
    loader.value = false
  }

  function setAsset(newAsset: AssetDetailItemDto) {
    const { getAuthorConflicts } = useAssetSuggestions()
    mainFileSingleUse.value = newAsset?.mainFileSingleUse || false
    metadataAreTouched.value = false // todo check
    authorConflicts.value = getAuthorConflicts(newAsset.metadata.authorSuggestions)
    prefetchLazyData(newAsset) // todo check
    asset.value = newAsset
  }

  function prefetchLazyData(assetData: AssetDetailItemDto) {
    const { fetchCachedAuthors, addToCachedAuthors } = useCachedAuthors()
    const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

    addToCachedKeywords(assetData.keywords)
    addToCachedAuthors(assetData.authors)
    addToCachedAuthors(authorConflicts.value)
    fetchCachedKeywords()
    fetchCachedAuthors()
  }

  function setView(value: 'list' | 'queue') {
    view.value = value
  }

  function setDistributionCategory(value: DocIdNullable) {
    if (asset.value) {
      asset.value.distributionCategory = value
    }
  }

  function setDeleting() {
    if (!asset.value) return
    asset.value.attributes.assetStatus = DamAssetStatus.Deleting
  }

  function reset() {
    asset.value = null
    authorConflicts.value = []
    loader.value = false
    detail.value = false
    view.value = 'list'
    metadataAreTouched.value = false
    mainFileSingleUse.value = false
  }

  return {
    asset,
    authorConflicts,
    loader,
    siblingLoader,
    detail,
    view,
    metadataAreTouched,
    directDetailLoad,
    lastFetched,
    lastFetchedId,
    mainFileSingleUse,
    updateLastFetched,
    showDetail,
    hideDetail,
    showLoader,
    hideLoader,
    setAsset,
    prefetchLazyData,
    setView,
    setDistributionCategory,
    setDeleting,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetDetailStore, import.meta.hot))
}
