const RELOAD_KEY = 'anzu.appReloadAt'
const RELOAD_COOLDOWN = 30_000
export const RELOAD_VETO_GRACE = 3_000

let reloadRequested = false

export function requestAppReload(onReload?: () => void): boolean {
  if (reloadRequested) return true
  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY)) || 0
    if (Date.now() - lastReload < RELOAD_COOLDOWN) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // no stamp, no loop guard - better than a dead tab
  }
  reloadRequested = true
  // a beforeunload handler can veto the reload
  setTimeout(() => {
    reloadRequested = false
  }, RELOAD_VETO_GRACE)
  // runs once per reload and while the document can still put a request on the wire
  onReload?.()
  window.location.reload()
  return true
}
