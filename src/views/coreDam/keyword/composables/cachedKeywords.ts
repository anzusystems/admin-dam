import type { Keyword, KeywordMinimal } from '@/types/coreDam/Keyword'
import { fetchKeywordListByIds } from '@/services/api/coreDam/keywordApi'
import type { DocId } from '@anzusystems/common-admin'
import { defineCached } from '@/composables/system/defineCached'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const mapFullToMinimal = (keyword: Keyword): KeywordMinimal => ({
  id: keyword.id,
  name: keyword.name,
})

const mapIdToMinimal = (id: DocId): KeywordMinimal => {
  return { id: id, name: '' }
}

const { cache, toFetch, fetch, add, addManual, addManualMinimal, has, get, isLoaded } = defineCached<
  DocId,
  Keyword,
  KeywordMinimal
>(mapFullToMinimal, mapIdToMinimal, (ids) => {
  const { currentExtSystemId } = useCurrentExtSystem()
  return fetchKeywordListByIds(currentExtSystemId.value, ids)
})

export const useCachedKeywords = () => {
  return {
    addManualToCachedKeywords: addManual,
    addManualMinimalToCachedKeywords: addManualMinimal,
    addToCachedKeywords: add,
    fetchCachedKeywords: fetch,
    toFetchCachedKeywords: toFetch,
    cachedKeywords: cache,
    hasCachedKeyword: has,
    getCachedKeyword: get,
    isLoadedCachedKeyword: isLoaded,
  }
}

export const useCachedKeywordsForRemoteAutocomplete = () => {
  return {
    fetch,
    add,
    addManualMinimal,
    minimalValueFieldName: 'name',
  }
}
