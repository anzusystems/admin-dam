import { acceptHMRUpdate, defineStore } from 'pinia'
import { type AssetDetailItemDto, useAssetSuggestions } from '@anzusystems/common-admin'
import { DamAssetStatus } from '@anzusystems/common-admin'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { useCachedAuthors } from '@/views/coreDam/author/composables/cachedAuthors'
import { useCachedKeywords } from '@/views/coreDam/keyword/composables/cachedKeywords'

interface State {
  asset: AssetDetailItemDto | null
  authorConflicts: DocId[]
  loader: boolean
  siblingLoader: boolean
  detail: boolean
  view: 'list' | 'queue'
  metadataAreTouched: boolean
  directDetailLoad: boolean
  lastFetched: number
  lastFetchedId: DocId
  mainFileSingleUse: boolean
}

export const useAssetDetailStore = defineStore('damAssetDetailStore', {
  state: (): State => ({
    asset: null,
    authorConflicts: [],
    loader: false,
    siblingLoader: false,
    detail: false,
    view: 'list',
    metadataAreTouched: false,
    directDetailLoad: false,
    lastFetched: Date.now(),
    lastFetchedId: '',
    mainFileSingleUse: false,
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
      const { getAuthorConflicts } = useAssetSuggestions()
      this.mainFileSingleUse = asset?.mainFileSingleUse || false
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
      addToCachedAuthors(this.authorConflicts)
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
      this.asset.attributes.assetStatus = DamAssetStatus.Deleting
    },
    reset() {
      this.asset = null
      this.authorConflicts = []
      this.loader = false
      this.detail = false
      this.view = 'list'
      this.metadataAreTouched = false
      this.mainFileSingleUse = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetDetailStore, import.meta.hot))
}
