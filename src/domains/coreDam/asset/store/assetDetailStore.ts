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
  const mainFileOverrideInternal = ref(false)
  const mainFileInternal = ref(false)
  const ttsAudio = ref(false)

  /* Clicks, held-down arrow keys, the queue's edit button and the deep-link view put several detail
   * fetches on the wire at once and they do not come back in order; only the newest may write here.
   * It always reaches its own `finally` and lowers the loader - after `abandonDetailRequests` none
   * is newest, and the loader waits for the reset every component does on mount. */
  let detailRequests = 0
  const startDetailRequest = () => ++detailRequests
  const isCurrentDetailRequest = (token: number) => token === detailRequests
  /* Nothing on the wire is this detail's answer any more - called where the user leaves it behind
   * altogether, because a request coming back after that moved the address from wherever they went. */
  const abandonDetailRequests = () => detailRequests++

  function updateLastFetched(id: DocId) {
    lastFetchedId.value = id
    lastFetched.value = Date.now()
  }

  function showDetail() {
    detail.value = true
  }

  function hideDetail() {
    // Only the dialog: the requests stay, because the panel on the right reads this same store.
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
    mainFileOverrideInternal.value = newAsset?.mainFile?.flags.overrideInternal || false
    mainFileInternal.value = newAsset?.mainFile?.flags.internal || false
    ttsAudio.value = newAsset?.assetFileProperties?.ttsAudio || false
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
    abandonDetailRequests()
    /* The cache keys off these two, so leaving them behind meant a click within five seconds of a
     * reset short-circuited to a detail that is no longer loaded - a fullscreen dialog with no
     * content and no way out but Esc. */
    lastFetchedId.value = ''
    lastFetched.value = 0
    asset.value = null
    authorConflicts.value = []
    loader.value = false
    detail.value = false
    view.value = 'list'
    metadataAreTouched.value = false
    mainFileSingleUse.value = false
    mainFileOverrideInternal.value = false
    mainFileInternal.value = false
    ttsAudio.value = false
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
    mainFileOverrideInternal,
    mainFileInternal,
    ttsAudio,
    startDetailRequest,
    isCurrentDetailRequest,
    abandonDetailRequests,
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
