import type { Author, AuthorMinimal } from '@/types/coreDam/Author'
import { fetchAuthorListByIds } from '@/services/api/coreDam/authorApi'
import type { DocId } from '@anzusystems/common-admin'
import { defineCached } from '@anzusystems/common-admin'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const mapFullToMinimal = (author: Author): AuthorMinimal => ({
  id: author.id,
  name: author.name,
  identifier: author.identifier,
})

const mapIdToMinimal = (id: DocId): AuthorMinimal => {
  return { id: id, name: '', identifier: '' }
}

const { cache, toFetch, fetch, add, addManual, addManualMinimal, has, get, isLoaded } = defineCached<
  DocId,
  Author,
  AuthorMinimal
>(mapFullToMinimal, mapIdToMinimal, (ids) => {
  const { currentExtSystemId } = useCurrentExtSystem()
  return fetchAuthorListByIds(currentExtSystemId.value, ids)
})

export const useCachedAuthors = () => {
  return {
    addManualToCachedAuthors: addManual,
    addManualMinimalToCachedAuthors: addManualMinimal,
    addToCachedAuthors: add,
    fetchCachedAuthors: fetch,
    toFetchCachedAuthors: toFetch,
    cachedAuthors: cache,
    hasCachedAuthor: has,
    getCachedAuthor: get,
    isLoadedCachedAuthor: isLoaded,
  }
}

export const useCachedAuthorsForRemoteAutocomplete = () => {
  return {
    fetch,
    add,
    addManualMinimal,
  }
}
