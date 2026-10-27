import type { RouteLocation, Router } from 'vue-router'

/**
 * TODO(#85491): temporary shim for the pre-2.0.0 route paths.
 *
 * 2.0.0 pluralized every route path and shipped no redirect layer, so every link and bookmark
 * created before it 404s on the catch-all page. Known link sources that have to be updated before
 * this file can be deleted (along with both call sites in `./index.ts`):
 *
 * - `/asset/:id` — `DamAdminAssetLink.vue` in common-admin builds `adminDomain + '/asset/' + id`
 *   (rendered by admin-cms in the audio widget and the audio/video embed dialogs, by common-admin
 *   itself in the image detail dialog, and inherited by admin-ugc).
 * - `/asset/file/:id` — asset-file detail linked from an external library.
 * - `/user/:id/edit` — admin-cms `DAM_USER_EDIT_URL_TEMPLATE`, opened by `SystemUserEditButton.vue`.
 *   Its value lives in `.env`, every developer's `.env.local`, the generated `public/config.json`
 *   and the deployment pipeline variables, so it outlives a single code change.
 *
 * Everything else is covered because users bookmark list and detail pages; those bookmarks are not
 * trackable, so the whole rename is mapped rather than only the paths we can point at.
 */
const RENAMED_ROOTS: Record<string, string> = {
  '/anzu-user': '/anzu-users',
  '/asset': '/assets',
  '/asset-licence': '/asset-licences',
  '/asset-licence-group': '/asset-licence-groups',
  '/author': '/authors',
  '/author-clean-phrase': '/author-clean-phrases',
  '/distribution-category': '/distribution-categories',
  '/distribution-category-select': '/distribution-category-selects',
  '/ext-system': '/ext-systems',
  '/external-provider': '/external-providers',
  '/job': '/jobs',
  '/keyword': '/keywords',
  '/permission-group': '/permission-groups',
  '/podcast': '/podcasts',
  '/public-export': '/public-exports',
  '/tts-narration-request': '/tts-narration-requests',
  '/user': '/users',
  '/video-show': '/video-shows',
  '/voice-family': '/voice-families',
}

// the rename went one level deeper for podcast and video-show episodes; ids never collide with it
const RENAMED_SEGMENTS: Record<string, string> = {
  episode: 'episodes',
}

/*
 * The logs are not a plain rename. The pre-2.0.0 `/log` and 2.x `/logs`
 * had the list at the root and the detail at `:system/:type/:id`.
 * The system is now the fixed `dam` segment and the list sits
 * under its type. Other paths under them go to the catch-all page.
 */
const LEGACY_LOG_ROOTS = ['/log', '/logs']
const LOG_LIST = '/logs/dam/app'

// the legacy paths are not part of the generated route map, so `to.params` is typed as the union of
// every known route's params and needs narrowing
const restOf = (to: RouteLocation) => (to.params as { rest?: string | string[] }).rest

const rewriteRest = (rest: string | string[] | undefined) => {
  const segments = Array.isArray(rest) ? rest : (rest ?? '').split('/')
  return segments
    .filter((segment) => segment.length > 0)
    .map((segment) => RENAMED_SEGMENTS[segment] ?? segment)
    .join('/')
}

export const addLegacyRedirects = (router: Router) => {
  for (const [legacy, current] of Object.entries(RENAMED_ROOTS)) {
    router.addRoute({
      path: `${legacy}/:rest(.*)?`,
      redirect: (to) => {
        const rest = rewriteRest(restOf(to))
        return { path: rest.length > 0 ? `${current}/${rest}` : current, query: to.query, hash: to.hash }
      },
    })
  }
  for (const legacy of LEGACY_LOG_ROOTS) {
    router.addRoute({
      path: legacy,
      redirect: (to) => ({ path: LOG_LIST, query: to.query, hash: to.hash }),
    })
    // The id pattern matches the detail page's. A current `/logs/dam/...` address outranks this
    // record by its static segment, and an invalid id matches neither, so the redirect never loops.
    router.addRoute({
      path: `${legacy}/:system/:type/:id([0-9a-f]{24})`,
      redirect: (to) => {
        const { type, id } = to.params as { type: string; id: string }
        return { path: `/logs/dam/${type}/${id}`, query: to.query, hash: to.hash }
      },
    })
  }
}
