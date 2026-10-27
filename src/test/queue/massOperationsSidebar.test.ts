import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'
const GENERAL = 'Main'

const on = (enabled: boolean) => ({ enabled, required: false })

const sidebar = async (types: DamAssetTypeType[], extSystem: UploadUiSetup['extSystem']) => {
  const rows = types.map((assetType, index) =>
    queueRow({ status: 'uploaded', canEditMetadata: true, assetId: 'asset-' + index, assetType })
  )
  const ui = await startUploadUi({ server, queues: { [QUEUE]: rows }, extSystem })
  const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
    queueId: QUEUE,
    massOperations: true,
  })
  const root = list.querySelector<HTMLElement>('.asset-queue-editable__sidebar')!
  const asked: string[] = []
  vi.spyOn(ui.store, 'queueItemsReplaceEmptyKeywords').mockImplementation((_queueId, _value, forceReplace) => {
    asked.push(forceReplace ? 'keywords replaced' : 'keywords filled')
  })
  vi.spyOn(ui.store, 'queueItemsReplaceEmptyAuthors').mockImplementation((_queueId, _value, forceReplace) => {
    asked.push(forceReplace ? 'authors replaced' : 'authors filled')
  })
  const titleOf = (panel: Element) => panel.querySelector('.v-expansion-panel-title')?.textContent?.trim()
  const panels = () => Array.from(root.querySelectorAll('.v-expansion-panel')).map(titleOf)
  const inputs = () => {
    const general = Array.from(root.querySelectorAll('.v-expansion-panel')).find((panel) => titleOf(panel) === GENERAL)

    return Array.from(general?.querySelectorAll('.v-input label.v-field-label--floating') ?? []).map((label) =>
      label.textContent?.trim()
    )
  }
  const press = (name: string) => {
    buttonsNamed(root, name)[0].click()

    return asked.splice(0)
  }

  return { panels, inputs, fillAll: () => press('Fill only empty'), replaceAll: () => press('Replace all') }
}

beforeEach(() => {
  server = createFakeDam()
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('mass operations of the queue: keywords and authors', () => {
  const imagesKeywordsDocumentsAuthors = {
    image: { keywords: on(true), authors: on(false) },
    document: { keywords: on(false), authors: on(true) },
  }

  it('are offered and written only when a type in the queue has them enabled', async () => {
    const images = await sidebar(['image', 'image'], imagesKeywordsDocumentsAuthors)
    expect(images.inputs()).toEqual(['Keywords'])
    expect(images.fillAll()).toEqual(['keywords filled'])
    expect(images.replaceAll()).toEqual(['keywords replaced'])
    stopUploadUi()

    // Documents have authors and no keywords. "Fill all" used to write both, whatever the types in the queue.
    const documents = await sidebar(['document', 'document'], imagesKeywordsDocumentsAuthors)
    expect(documents.inputs()).toEqual(['Authors'])
    expect(documents.fillAll()).toEqual(['authors filled'])
    expect(documents.replaceAll()).toEqual(['authors replaced'])
  })

  it('are left out altogether, with the general panel, where no type in the queue has them', async () => {
    const neither = await sidebar(['video', 'audio'], {
      image: { keywords: on(true), authors: on(true) },
      video: { keywords: on(false), authors: on(false) },
      audio: { keywords: on(false), authors: on(false) },
    })

    expect(neither.panels()).toEqual(['Video', 'Audio'])
    expect(neither.fillAll()).toEqual([])
    expect(neither.replaceAll()).toEqual([])
  })

  it('are both offered for a queue of types that have one each', async () => {
    const mixed = await sidebar(['image', 'document'], imagesKeywordsDocumentsAuthors)

    expect(mixed.inputs()).toEqual(['Keywords', 'Authors'])
    expect(mixed.fillAll()).toEqual(['authors filled', 'keywords filled'])
  })
})
