import * as path from 'path'
import { type Page } from '@playwright/test'
import { type RouteWalkOptions } from '@anzusystems/common-admin/e2e'
import { UNSPLASH } from '@pages/assets/externalProviderPage'
import { ADMIN_SUITE } from '@pages/shared/constants'
import { forceLogin } from '@pages/shared/login'
import { coreDamUrl } from '@pages/shared/urls'

/** A GET on core-dam's `/api` (`/adm/users/current` is not under `/adm/v1`). */
const apiGet = async <T>(page: Page, endpoint: string): Promise<T> => {
  const response = await page.request.get(`${coreDamUrl()}/api${endpoint}`)
  // A resolver that gets no record skips its route, so a failed call has to fail it instead.
  if (!response.ok()) throw new Error(`GET ${endpoint} answered ${response.status()}`)
  return (await response.json()) as T
}

const apiList = async <T>(page: Page, endpoint: string): Promise<T[]> =>
  (await apiGet<{ data?: T[] }>(page, endpoint)).data ?? []

/** The licence the account works in: the asset list and the shows are listed by it. */
const currentLicence = async (page: Page): Promise<number | undefined> => {
  const user = await apiGet<{ selectedLicence?: number | null; assetLicencesDto?: { id: number }[] }>(
    page,
    '/adm/users/current'
  )
  return user.selectedLicence ?? user.assetLicencesDto?.[0]?.id
}

/**
 * The first asset of that licence. The asset list is a grid of tiles: no link to an asset and no table row the
 * walk could take an id from.
 */
const firstAsset = async (page: Page) => {
  const licence = await currentLicence(page)
  if (licence === undefined) return undefined
  const [asset] = await apiList<{ id: string; mainFile?: { id: string } | null }>(
    page,
    `/adm/v1/asset/licence/search?licences=${licence}&limit=1&offset=0`
  )
  return asset
}

/**
 * An episode with its show. The address holds both ids, and the walk finds one: the episodes are listed on their
 * show's detail, not on a page of their own.
 */
const firstEpisode = async (page: Page, show: 'podcast' | 'video-show', suffix: string) => {
  const licence = await currentLicence(page)
  if (licence === undefined) return undefined
  const shows = await apiList<{ id: string }>(
    page,
    `/adm/v1/${show}/licence/${licence}?limit=10&offset=0&order[id]=desc`
  )
  for (const { id } of shows) {
    const [episode] = await apiList<{ id: string }>(
      page,
      `/adm/v1/${show}-episode/${show}/${id}?limit=1&offset=0&order[id]=desc`
    )
    if (episode) return `/${show}s/${id}/episodes/${episode.id}${suffix}`
  }
  return undefined
}

const PODCAST_EPISODE = '/podcasts/:id([0-9a-f-]{36})/episodes/:episodeId([0-9a-f-]{36})'
const VIDEO_SHOW_EPISODE = '/video-shows/:id([0-9a-f-]{36})/episodes/:episodeId([0-9a-f-]{36})'

/** What the route walk needs to know about admin-dam. Shared by `boot.spec.ts` and `routes.spec.ts`. */
export const routeWalk: RouteWalkOptions = {
  title: `${ADMIN_SUITE} - Routes`,
  declarationFile: path.resolve(__dirname, '../../../src/typed-router.d.ts'),
  pagesDir: path.resolve(__dirname, '../../../src/pages'),
  login: forceLogin,
  skip: {
    '/logout': 'ends the session the worker walks in',
  },
  params: {
    // The log list the sidebar opens (`LogTypeDefault`).
    type: 'app',
    // The provider the suite imports from (tests/assets/externalProviderUnsplash.spec.ts).
    provider: UNSPLASH,
  },
  resolve: {
    '/assets/:id': async (page) => {
      const asset = await firstAsset(page)
      return asset && `/assets/${asset.id}`
    },
    // `/assets/file` is not a page: a file is opened from its asset.
    '/assets/file/:id': async (page) => {
      const asset = await firstAsset(page)
      return asset?.mainFile ? `/assets/file/${asset.mainFile.id}` : undefined
    },
    [PODCAST_EPISODE]: (page) => firstEpisode(page, 'podcast', ''),
    [`${PODCAST_EPISODE}/edit`]: (page) => firstEpisode(page, 'podcast', '/edit'),
    [VIDEO_SHOW_EPISODE]: (page) => firstEpisode(page, 'video-show', ''),
    [`${VIDEO_SHOW_EPISODE}/edit`]: (page) => firstEpisode(page, 'video-show', '/edit'),
  },
  redirects: {
    // The start-up opens the asset list (src/domains/system/composables/appInitialize.ts).
    '/': /^\/assets$/,
    // Opened directly, the error page runs the start-up again (src/router/beforeEachRoute.ts).
    '/error': /^\/assets$/,
  },
  ignore: [
    {
      problem: /^xhr 500: GET .*\/adm\/v1\/asset-external-provider\/[^/]+\/search\?/,
      routes: /^\/external-providers\//,
      // The page searches with an empty term when it opens; core-dam passes it to Unsplash's /search/photos,
      // which answers 400 without a query.
      reason: "the provider's search answers 500 (DAM-B1, see tests/assets/externalProviderUnsplash.spec.ts)",
    },
  ],
}
