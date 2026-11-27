import type { LocationQuery, NavigationGuardReturn, RouteLocationNormalized, RouteLocationRaw } from 'vue-router'

export const ERROR_PAGE_PATH = '/error'
const RETURN_QUERY = 'redirect'

// The address the failed start-up was opened with rides along, so a retry returns to it (filters in the hash too).
export const errorPageFor = (to: RouteLocationNormalized): RouteLocationRaw => {
  if (to.path === ERROR_PAGE_PATH) return { path: ERROR_PAGE_PATH, query: to.query }
  return to.path === '/' ? ERROR_PAGE_PATH : { path: ERROR_PAGE_PATH, query: { [RETURN_QUERY]: to.fullPath } }
}

const isErrorPage = (result: NavigationGuardReturn): boolean => {
  if (result === ERROR_PAGE_PATH) return true
  if (typeof result !== 'object' || result === null) return false
  return ('path' in result && result.path === ERROR_PAGE_PATH) || ('name' in result && result.name === ERROR_PAGE_PATH)
}

// The start-up sends a failure to the error page. This gives the page the address the user opened.
export const withReturnPath = (result: NavigationGuardReturn, to: RouteLocationNormalized): NavigationGuardReturn =>
  isErrorPage(result) ? errorPageFor(to) : result

const isControlCharacter = (code: number): boolean => code < 0x20 || code === 0x7f

// The URL parser drops tabs and line breaks, so `/\t/host` opens `//host`: the path must also resolve to this origin.
export const errorPageReturnPath = (query: LocationQuery): string => {
  const value = query[RETURN_QUERY]
  if (typeof value !== 'string' || !/^\/(?![/\\])/.test(value)) return '/'
  if (Array.from(value, (char) => char.charCodeAt(0)).some(isControlCharacter)) return '/'
  return new URL(value, window.location.origin).origin === window.location.origin ? value : '/'
}

// A document load, not a router navigation: vue-router re-encodes a redirect's hash, and a filter hash
// with `%26` or `%3D` would come back changed. Its own function so a test can replace it.
export const openAppPath = (path: string, { replace = false }: { replace?: boolean } = {}) => {
  if (replace) window.location.replace(path)
  else window.location.href = path
}
