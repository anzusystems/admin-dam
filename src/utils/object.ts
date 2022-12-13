import { isUndefined } from '@/utils/common'

export const deepFreeze = <T>(obj: T) => {
  const propNames = Object.getOwnPropertyNames(obj)
  for (const name of propNames) {
    const value = (obj as any)[name]
    if (value && typeof value === 'object') {
      deepFreeze(value)
    }
  }
  return Object.freeze(obj)
}

export const isEmpty = (object: any) => {
  for (const property in object) {
    return false
  }
  return true
}

export const getValues = <T>(obj: { [key: string]: T }): T[] => {
  return Object.keys(obj).map((k) => obj[k])
}

export const getValueByPath = (obj: any, path: string, splitChar = '.') => {
  const a = path.split(splitChar)
  let o = obj
  while (a.length) {
    const n = a.shift()
    if (isUndefined(n) || !(n in o)) return
    o = o[n]
  }
  return o
}

export const setValueByPath = (obj: any, path: string, value: any, splitChar = '.') => {
  const a = path.split(splitChar)
  let o = obj
  while (a.length - 1) {
    const n = a.shift()
    if (isUndefined(n)) return // todo check if correct if
    if (!(n in o)) o[n] = {}
    o = o[n]
  }
  o[a[0]] = value
}

/**
 * Use only for objects with some primitives like number, string, boolean, null. Not supported: function, undefined, symbol, ...
 */
export const simpleCloneObject = <T>(object: T) => {
  return JSON.parse(JSON.stringify(object)) as T
}
