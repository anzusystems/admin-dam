import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { assetDetail, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, setWindowWidth, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * A button that toggles a panel should state whether it is open only where the panel really opens and closes.
 * A closed panel that the library only slides out of view is still reachable by keyboard and screen reader.
 * Cases: the detail info panel from 840 px width, and the mass operations of the two queue overlays from two rows.
 * Uses the real components in English, the app initialised, and a fake server.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const INFO = 'Toggle info'
const MASS = 'Mass operations'

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the info toggle of a detail', () => {
  const mountDetail = async (width: number) => {
    const ui = await startUploadUi({ server })
    setWindowWidth(width)
    const { useExternalProviderAssetDetailStore } =
      await import('@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore')
    const store = useExternalProviderAssetDetailStore()
    store.setAsset({
      id: 'provider-asset',
      texts: { displayTitle: 'A picture' },
      attributes: { assetType: 'image' },
      url: '',
      metadata: {},
    })
    store.showDetail()
    await ui.mount(() => import('@/domains/coreDam/externalProvider/components/ExternalProviderAssetDetailDialog.vue'))
    await nextTick()
    const toggle = () => buttonsNamed(document.body, INFO)[0]!
    const panel = () => document.body.querySelector<HTMLElement>('.dam-image-detail__sidebar')!

    return {
      toggle,
      said: () => ({
        expanded: toggle().getAttribute('aria-expanded'),
        controls: toggle().getAttribute('aria-controls') === panel().id && !!panel().id,
        inert: panel().inert,
      }),
    }
  }

  it('says from 840 px wide whether the panel is open, and leaves a closed one out of reach', async () => {
    const { toggle, said } = await mountDetail(840)

    expect(said()).toEqual({ expanded: 'true', controls: true, inert: false })
    toggle().click()
    await nextTick()
    expect(said()).toEqual({ expanded: 'false', controls: true, inert: true })
  })

  // Below this width the panel is always shown, and the toggle shows and hides the image above it.
  it('says nothing of the panel narrower, and leaves it in reach', async () => {
    const { toggle, said } = await mountDetail(839)

    expect(said()).toEqual({ expanded: null, controls: false, inert: false })
    toggle().click()
    await nextTick()
    expect(said()).toEqual({ expanded: null, controls: false, inert: false })
  })
})

describe('the mass operations toggle of an overlay', () => {
  const editable = (assetId: string, over: Partial<UploadQueueItem> = {}) =>
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId, fileId: 'file-of-' + assetId, ...over })

  const overlays = {
    uploads: async (assets: string[]) => {
      const ui = await startUploadUi({ server, queues: { global: assets.map((id) => editable(id)) } })
      const { useAssetFooterUploadView } = await import('@/domains/coreDam/asset/composables/assetFooterUpload')
      useAssetFooterUploadView().setFullUpload()

      return ui.mount(() => import('@/domains/coreDam/asset/components/footer/AssetFooterUploadOverlayFull.vue'))
    },
    'mass edit': async (assets: string[]) => {
      const ui = await startUploadUi({ server, queues: { edit: assets.map((id) => editable(id, { type: 'asset' })) } })
      const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
      useAssetListStore().setList(assets.map((id) => assetDetail(id)) as never, ui.store.getQueueItems('edit'))
      const { useAssetFooterSelectedView } = await import('@/domains/coreDam/asset/composables/assetFooterSelected')
      useAssetFooterSelectedView().setFullSelected()

      return ui.mount(() => import('@/domains/coreDam/asset/components/footer/AssetFooterSelectedFull.vue'))
    },
  }

  it.each(Object.keys(overlays) as Array<keyof typeof overlays>)(
    'of the %s is not there for one row, where there is no panel to open',
    async (name) => {
      const overlay = await overlays[name](['asset-1'])
      await nextTick()

      expect([
        buttonsNamed(overlay, MASS),
        overlay.querySelectorAll('.dam-upload-queue__item').length,
        overlay.querySelector('.asset-queue-editable__sidebar'),
      ]).toEqual([[], 1, null])
    }
  )

  it.each(Object.keys(overlays) as Array<keyof typeof overlays>)(
    'of the %s says from two rows whether the panel is open, and leaves what a closed one holds out of reach',
    async (name) => {
      const overlay = await overlays[name](['asset-1', 'asset-2'])
      await nextTick()
      const toggle = buttonsNamed(overlay, MASS)[0]!
      const held = () => overlay.querySelector<HTMLElement>('.asset-queue-editable__sidebar > div')!
      const said = () => [toggle.getAttribute('aria-expanded'), held().inert, !!held().textContent?.trim()]
      // The overlay starts open or closed depending on window width (narrow: closed).
      const open = toggle.getAttribute('aria-expanded') === 'true'

      expect(said()).toEqual([String(open), !open, true])
      toggle.click()
      await nextTick()
      expect(said()).toEqual([String(!open), open, true])
      toggle.click()
      await nextTick()
      expect(said()).toEqual([String(open), !open, true])
    }
  )
})
