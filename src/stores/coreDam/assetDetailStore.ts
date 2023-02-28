import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AssetDetailItemDto } from '@/types/coreDam/Asset'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { objectGetValues } from '@anzusystems/common-admin'
import { loadLazyKeyword } from '@/views/coreDam/keyword/composables/lazyKeyword'
import { loadLazyAuthor } from '@/views/coreDam/author/composables/lazyAuthor'

interface State {
  asset: AssetDetailItemDto | null
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
      this.prefetchLazyData(asset) // todo check
      this.asset = asset
    },
    prefetchLazyData(asset: AssetDetailItemDto) {
      const { fetchLazyKeyword, addToLazyKeywordBuffer } = loadLazyKeyword()
      const { fetchLazyAuthor, addToLazyAuthorBuffer } = loadLazyAuthor()

      asset.keywords.forEach((id) => addToLazyKeywordBuffer(id))
      asset.authors.forEach((id) => addToLazyAuthorBuffer(id))
      objectGetValues(asset.metadata.authorSuggestions)
        .filter((ids) => ids.length > 1)
        .forEach((ids) => ids.filter((id) => addToLazyAuthorBuffer(id)))
      fetchLazyKeyword()
      fetchLazyAuthor()
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
