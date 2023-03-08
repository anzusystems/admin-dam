import type { Suggestions } from '@/types/coreDam/Asset'
import { type DocId, isArray, isEmptyObject } from '@anzusystems/common-admin'

export const updateNewNames = (suggestions: Suggestions, newNames: Set<string>) => {
  for (const [key, value] of Object.entries(suggestions)) {
    if (isEmptyObject(value)) {
      newNames.add(key)
    }
  }
}

export const getAuthorConflicts = (suggestions: Suggestions) => {
  const conflicts: Array<DocId> = []
  for (const [key, value] of Object.entries(suggestions)) {
    if (isArray(value) && value.length > 1) {
      value.forEach((id) => {
        conflicts.push(id)
      })
    }
  }
  return conflicts
}
