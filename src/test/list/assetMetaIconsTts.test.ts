import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The icon an asset of synthesized speech carries in the list of assets, in its tile and in its row of the table,
 * with the title the end-to-end tests look for. The real list views over the real list store, with the application
 * around them as it starts; the server is a fake, and the store holds the assets as the search of the list answers
 * them. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const TTS = 'Syntetické (TTS)'

/** An asset as the search of the list answers it; nothing about it draws an icon unless told. */
const listItem = (id: string, assetFileProperties: Record<string, unknown> = {}) => ({
  id,
  texts: { displayTitle: id, description: '' },
  attributes: { assetType: 'audio', assetStatus: 'with_file' },
  flags: { described: true, visible: true },
  licence: 1,
  mainFile: null,
  podcasts: [],
  assetFileProperties: {
    distributesInServices: [],
    slotNames: [],
    fromRss: false,
    width: 0,
    height: 0,
    ...assetFileProperties,
  },
  mainFileSingleUse: false,
  mainFileInternal: false,
  mainFileOverrideInternal: false,
  createdAt: '2026-10-09T10:00:00.000000Z',
  modifiedAt: '2026-10-09T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  _resourceName: 'asset',
  _system: 'dam',
})

const ASSETS = [
  listItem('asset-tts', { ttsAudio: true }),
  // Another icon, so the place of the icons is there: the title of synthesized speech is not among them.
  listItem('asset-rss', { ttsAudio: false, fromRss: true }),
  // The search may leave the flag out.
  listItem('asset-plain'),
]

/** The titles of the icons over the asset, in the order they are drawn, and whether each is drawn and not hidden. */
const icons = (element: Element) =>
  Array.from(element.querySelectorAll<HTMLImageElement>('.asset-image__meta-icons img')).map((icon) => ({
    title: icon.getAttribute('title'),
    drawn: !!icon.getAttribute('src') && !icon.closest('[style*="display: none"]'),
  }))

const mountList = async (view: 'AssetListTilesView' | 'AssetListTableView', language = 'sk') => {
  const ui = await startUploadUi({ server })
  const { i18n } = await import('@/plugins/i18n')
  if (language === 'sk') i18n.global.setLocaleMessage('sk', (await import('@/locales/sk')).default as never)
  i18n.global.locale.value = language as never
  const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
  useAssetListStore().setList(ASSETS as never)
  const list =
    view === 'AssetListTilesView'
      ? await ui.mount(() => import('@/domains/coreDam/asset/components/list/components/AssetListTilesView.vue'))
      : await ui.mount(() => import('@/domains/coreDam/asset/components/list/components/AssetListTableView.vue'))
  await nextTick()
  // The one place that knows how a tile and a row of the table are built.
  const items = () =>
    Array.from(
      list.querySelectorAll<HTMLElement>(view === 'AssetListTilesView' ? '.dam-image-grid__item' : 'tr.a-table__row')
    )
  /** The assets drawn, each by the title it shows, in no particular order. */
  const shown = () =>
    items()
      .map((element) => ASSETS.find((asset) => element.textContent?.includes(asset.id))?.id)
      .sort()
  /** The tile or the row of the asset, found by its title. */
  const item = (assetId: string) => {
    const found = items().filter((element) => element.textContent?.includes(assetId))
    expect(found).toHaveLength(1)

    return found[0]
  }

  return { ...ui, list, shown, item }
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe.each([
  ['tile', 'AssetListTilesView'],
  ['row of the table', 'AssetListTableView'],
] as const)('the %s of an asset in the list', (_name, view) => {
  it('carries the icon of synthesized speech, titled so, when the asset is of synthesized speech', async () => {
    const { item } = await mountList(view)

    expect(icons(item('asset-tts'))).toEqual([{ title: TTS, drawn: true }])
  })

  it('carries no such icon when the asset is not, or says nothing of it', async () => {
    const { shown, item } = await mountList(view)
    expect(shown()).toEqual(['asset-plain', 'asset-rss', 'asset-tts'])

    expect(icons(item('asset-rss'))).toEqual([{ title: 'RSS', drawn: true }])
    expect(icons(item('asset-plain'))).toEqual([])
  })

  it('titles the icon in the language of the user', async () => {
    const { item } = await mountList(view, 'en')

    expect(icons(item('asset-tts'))).toEqual([{ title: 'Synthesized (TTS)', drawn: true }])
  })
})
