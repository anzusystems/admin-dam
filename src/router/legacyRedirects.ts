import type { RouteLocation, Router } from 'vue-router'

/**
 * TODO(#85491): temporary shim for the pre-2.0.0 singular route paths.
 *
 * 2.0.0 pluralized every route and shipped no redirect layer, so links held outside this app 404.
 * Only the paths that are actually linked from elsewhere are covered here. Delete this file and
 * both call sites in `./index.ts` once every consumer below points at the plural path:
 *
 * - `/asset/:id` — `DamAdminAssetLink.vue` in common-admin builds `adminDomain + '/asset/' + id`
 *   (rendered by admin-cms in the audio widget and the audio/video embed dialogs, by common-admin
 *   itself in the image detail dialog, and inherited by admin-ugc).
 * - `/asset/file/:id` — asset-file detail linked from an external library.
 * - `/user/:id/edit` — admin-cms `DAM_USER_EDIT_URL_TEMPLATE`, opened by `SystemUserEditButton.vue`.
 *   Lives in its `.env`, every developer's `.env.local` and `public/config.json`, and in the
 *   deployment pipeline variable — so this one outlives a single code change.
 */
// the legacy paths are not part of the generated route map, so `to.params` is typed as the
// union of every known route's params and needs narrowing
const legacyId = (to: RouteLocation) => (to.params as { id: string }).id

export const addLegacyRedirects = (router: Router) => {
  router.addRoute({
    path: '/asset/:id',
    redirect: (to) => ({ name: '/(coreDam)/assets/[id]', params: { id: legacyId(to) } }),
  })
  router.addRoute({
    path: '/asset/file/:id',
    redirect: (to) => ({ name: '/(coreDam)/assets/file/[id]', params: { id: legacyId(to) } }),
  })
  router.addRoute({
    path: '/user/:id/edit',
    redirect: (to) => ({ name: '/(coreDam)/users/[id]/edit', params: { id: legacyId(to) } }),
  })
}
