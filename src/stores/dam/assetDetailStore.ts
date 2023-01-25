import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AssetDetailItemDto } from '@/types/dam/Asset'
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import { getValues } from '@/utils/object'
import { loadLazyKeyword } from '@/views/dam/keyword/composables/lazyKeyword'
import { loadLazyAuthor } from '@/views/dam/author/composables/lazyAuthor'
import type { DocIdNullable } from '@anzusystems/common-admin'

interface State {
  asset: AssetDetailItemDto | null
  loader: boolean
  detail: boolean
  view: 'list' | 'queue'
  metadataAreTouched: boolean
}

export const useAssetDetailStore = defineStore('damAssetDetailStore', {
  state: (): State => ({
    asset: null,
    loader: false,
    detail: false,
    view: 'list',
    metadataAreTouched: false,
  }),
  actions: {
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
      getValues(asset.metadata.authorSuggestions)
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
