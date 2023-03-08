import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AssetDetailItemDto } from '@/types/coreDam/Asset'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { objectGetValues } from '@anzusystems/common-admin'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'
import { getAuthorConflicts } from '@/services/AssetSuggestionsService'

interface State {
  asset: AssetDetailItemDto | null
  authorConflicts: DocId[]
  loader: boolean
  detail: boolean
  view: 'list' | 'queue'
  metadataAreTouched: boolean
  directDetailLoad: boolean
  lastFetched: number
  lastFetchedId: DocId
}

export const useAssetDetailStore = defineStore('damAssetDetailStore', {
  state: (): State => ({
    asset: null,
    authorConflicts: [],
    loader: false,
    detail: false,
    view: 'list',
    metadataAreTouched: false,
    directDetailLoad: false,
    lastFetched: Date.now(),
    lastFetchedId: '',
  }),
  actions: {
    updateLastFetched(id: DocId) {
      this.lastFetchedId = id
      this.lastFetched = Date.now()
    },
    showDetail() {
      this.detail = true
    },
    hideDetail() {
      this.detail = false
    },
    showLoader() {
      this.loader = true
    },
    hideLoader() {
      this.loader = false
    },
    setAsset(asset: AssetDetailItemDto) {
      this.metadataAreTouched = false // todo check
      this.authorConflicts = getAuthorConflicts(asset.metadata.authorSuggestions)
      this.prefetchLazyData(asset) // todo check
      this.asset = asset
    },
    prefetchLazyData(asset: AssetDetailItemDto) {
      const { fetchCachedAuthors, addToCachedAuthors } = useCachedAuthors()
      const { fetchCachedKeywords, addToCachedKeywords } = useCachedKeywords()

      addToCachedKeywords(asset.keywords)
      addToCachedAuthors(asset.authors)
      // objectGetValues(asset.metadata.authorSuggestions)
      //   .filter((ids) => ids.length > 1)
      //   .forEach((ids) => ids.filter((id) => addToCachedAuthors(id)))
      fetchCachedKeywords()
      fetchCachedAuthors()
    },
    setView(value: 'list' | 'queue') {
      this.view = value
    },
    setDistributionCategory(value: DocIdNullable) {
      if (this.asset) {
        this.asset.distributionCategory = value
      }
    },
    setDeleting() {
      if (!this.asset) return
      this.asset.attributes.assetStatus = AssetStatus.Deleting
    },
    reset() {
      this.asset = null
      this.authorConflicts = []
      this.loader = false
      this.detail = false
      this.view = 'list'
      this.metadataAreTouched = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetDetailStore, import.meta.hot))
}
