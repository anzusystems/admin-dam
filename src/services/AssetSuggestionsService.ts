import type { AssetMetadataSuggestions } from '@anzusystems/common-admin'
import { type DocId, isArray, isEmptyObject } from '@anzusystems/common-admin'

export const updateNewNames = (suggestions: AssetMetadataSuggestions, newNames: Set<string>) => {
  for (const [key, value] of Object.entries(suggestions)) {
    if (isEmptyObject(value)) {
      newNames.add(key)
    }
  }
}

export const getAuthorConflicts = (suggestions: AssetMetadataSuggestions) => {
  const conflicts: Array<DocId> = []
  for (const value of Object.values(suggestions)) {
    if (isArray(value) && value.length > 1) {
      value.forEach((id) => {
        conflicts.push(id)
      })
    }
  }
  return conflicts
}
