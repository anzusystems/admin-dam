import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { VLayout } from 'vuetify/components'

import { assetDetail, createFakeDam, httpError, validationError } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/*
 * Two editors save the same asset (#87746 DAM-B19, DAM-B25, DAM-B24).
 * core-dam keeps a field a save leaves out, but deletes a custom field left out of the custom data.
 * So a save sends only the fields its user changed, and changed custom data go rebased onto the asset
 * read again right before: the fields changed here over what the server has. The later save wins a field both changed.
 * A save of an asset deleted meanwhile says so, and nothing lets the asset be saved again.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const BATCH_READ = /^\/adm\/v1\/asset\/ext-system\/1\/ids\/.+$/
const EDIT = 'edit'
const UPDATED = 'Record was updated'
const DELETED = 'The asset has been deleted meanwhile.'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const ROW_DELETED = 'The asset has been deleted meanwhile and its row removed. Save the other rows again.'
const FORM: Partial<UploadUiSetup> = { customForm: { image: [customField('title'), customField('note')] } }

interface Held {
  id: string
  keywords: string[]
  authors: string[]
  mainFileSingleUse: boolean | null
  metadata: { customData: Record<string, unknown> }
}

// What the server holds, as core-dam saves it. A save written elsewhere goes straight in.
let held: Map<string, Held>

const onServer = (id: string, customData: Record<string, unknown>) => {
  const asset = assetDetail(id, {
    flags: { described: true },
    keywords: [],
    authors: [],
    metadata: { customData, authorSuggestions: {}, keywordSuggestions: {} },
  }) as unknown as Held
  held.set(id, asset)
  server.assetBy(id, () => held.get(id))
}

/** Another editor saved the asset: the server has these fields from now on. */
const savedElsewhere = (id: string, fields: { customData?: Record<string, unknown>; authors?: string[] }) => {
  const asset = held.get(id)!
  if (fields.customData) asset.metadata = { ...asset.metadata, customData: fields.customData }
  if (fields.authors) asset.authors = fields.authors
}

const deletedElsewhere = (id: string) => {
  held.delete(id)
  server.assetDeleted(id)
}

const customDataOf = (id: string) => held.get(id)!.metadata.customData

/*
 * Writes a save as core-dam does: a field left out stays, the custom data sent replace the old ones whole.
 * Answers with the asset's metadata as saved.
 */
const writtenAsCoreDam = (request: { data: unknown }) => {
  const items = JSON.parse(request.data as string) as Array<Record<string, unknown>>
  if (items.some((item) => !held.has(item.id as string))) throw httpError(500)

  return {
    status: 200,
    data: items.map((item) => {
      const asset = held.get(item.id as string)!
      if (item.keywords) asset.keywords = item.keywords as string[]
      if (item.authors) asset.authors = item.authors as string[]
      if (item.customData)
        asset.metadata = { ...asset.metadata, customData: item.customData as Record<string, unknown> }

      return {
        id: asset.id,
        described: true,
        keywords: asset.keywords,
        authors: asset.authors,
        sources: [],
        customData: customDataOf(asset.id),
        mainFileSingleUse: asset.mainFileSingleUse,
        mainFileOverrideInternal: false,
        mainFileInternal: false,
        ttsAudio: false,
      }
    }),
  }
}

const saved = () => server.sent('PATCH', BULK).map((request) => JSON.parse(request.data as string))
const batchReads = () => server.sent('GET', BATCH_READ).length

const listed = (id: string) => ({
  id,
  attributes: { assetType: 'image', assetStatus: 'with_file' },
  texts: { displayTitle: id },
  mainFile: { id: 'file-of-' + id, links: {} },
  mainFileSingleUse: null,
})

/*
 * The rows of the mass edit, saved by the function its buttons call. The helpers use only what the app had
 * before the fix too, so the same cases show the bug on that code.
 */
const pickedForMassEdit = async (ids: string[]) => {
  const ui = await startUploadUi({ server, ...FORM })
  await ui.store.addByAssets(EDIT, ids.map(listed) as never)
  await eventually(() =>
    expect(ui.store.getQueueItems(EDIT).every((row) => row.status === 'uploaded' && row.canEditMetadata)).toBe(true)
  )
  const api = await import('@/domains/coreDam/asset/api/assetApi')
  const rows = () => ui.store.getQueueItems(EDIT)

  return {
    ...ui,
    rows,
    row: (index = 0): UploadQueueItem => rows()[index],
    save: () => api.bulkUpdateAssetsMetadata(rows()),
    rejection: () =>
      api.bulkUpdateAssetsMetadata(rows()).then(
        () => undefined,
        (error: unknown) => error
      ),
  }
}

// The mass edit as the user has it: its overlay, whose save button says how the save went.
const massEditOverlay = async (ids: string[]) => {
  const picked = await pickedForMassEdit(ids)
  const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
  const { useAssetFooterSelectedView } = await import('@/domains/coreDam/asset/composables/assetFooterSelected')
  useAssetListStore().setList(ids.map((id) => held.get(id)) as never, picked.rows())
  useAssetFooterSelectedView().setFullSelected()
  const overlay = await picked.mount(
    () => import('@/domains/coreDam/asset/components/footer/AssetFooterSelectedFull.vue')
  )
  const saveButton = () => overlay.querySelector('.v-toolbar .mdi-content-save')!.closest<HTMLButtonElement>('button')!

  return {
    ...picked,
    pressSave: async () => {
      saveButton().click()
      await nextTick()
      await eventually(() => expect(saveButton().classList.contains('v-btn--loading')).toBe(false))
      await eventually(() => expect(picked.alerts()).not.toEqual([]))
    },
  }
}

const panelOf = async (id: string) => {
  server.on('GET', /^\/adm\/v1\/(keyword|author)\//, () => ({ status: 200, data: { data: [] } }))
  const ui = await startUploadUi({ server, ...FORM })
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')
  const detail = useAssetDetailStore()
  detail.setAsset(structuredClone(held.get(id)) as never)
  const Panel = (await import('@/domains/coreDam/asset/components/list/components/AssetListSidebarMetadata.vue'))
    .default
  const root = await ui.mount(async () => ({
    default: defineComponent({ setup: () => () => h(VLayout, null, () => h(Panel)) }),
  }))
  const field = (index: number) => root.querySelectorAll<HTMLTextAreaElement>('textarea')[index]
  const saveButton = () => buttonsNamed(root, 'Save')[0]

  return {
    ...ui,
    detail,
    saveButton,
    type: async (index: number, value: string) => {
      field(index).value = value
      field(index).dispatchEvent(new Event('input'))
      await nextTick()
    },
    shown: () => [field(0).value, field(1).value],
    // Done once the button stops spinning and an alert says how it went.
    save: async () => {
      saveButton().click()
      await nextTick()
      await eventually(() => expect(saveButton().classList.contains('v-btn--loading')).toBe(false))
      await eventually(() => expect(ui.alerts()).not.toEqual([]))
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  held = new Map()
  server.on('PATCH', BULK, writtenAsCoreDam)
})

afterEach(() => {
  stopUploadUi()
})

describe('the bulk save of a mass edit, after another editor saved the asset', () => {
  it('keeps the custom fields the other editor filled in or changed, and saves the field typed here', async () => {
    onServer('asset-1', { title: 'first', note: 'first note' })
    const { row, save } = await pickedForMassEdit(['asset-1'])
    savedElsewhere('asset-1', { customData: { title: 'first', note: 'their note', caption: 'their caption' } })
    const readsBefore = batchReads()

    row().customData = { ...row().customData, title: 'typed' }
    await save()

    expect(customDataOf('asset-1')).toEqual({ title: 'typed', note: 'their note', caption: 'their caption' })
    expect([batchReads() - readsBefore, saved()]).toEqual([
      1,
      [
        [
          {
            id: 'asset-1',
            described: true,
            customData: { title: 'typed', note: 'their note', caption: 'their caption' },
          },
        ],
      ],
    ])
  })

  it('shows in the row what the save took from the other editor, and sends nothing of it again', async () => {
    onServer('asset-1', { title: 'first', note: 'first note' })
    const { row, save } = await pickedForMassEdit(['asset-1'])
    savedElsewhere('asset-1', { customData: { title: 'first', note: 'their note' } })
    row().customData = { ...row().customData, title: 'typed' }
    await save()

    expect(row().customData).toEqual({ title: 'typed', note: 'their note' })
    await save()
    expect(saved()).toHaveLength(1)
  })

  it('saves the value typed here over the other editor’s in a field both changed: the later save wins', async () => {
    onServer('asset-1', { title: 'first', note: 'first note' })
    const { row, save } = await pickedForMassEdit(['asset-1'])
    savedElsewhere('asset-1', { customData: { title: 'theirs', note: 'first note' } })

    row().customData = { ...row().customData, title: 'typed' }
    await save()

    expect(customDataOf('asset-1')).toEqual({ title: 'typed', note: 'first note' })
  })

  it('reads nothing again before a save without custom data, and leaves the other editor’s authors', async () => {
    onServer('asset-1', { title: 'first' })
    const { row, save } = await pickedForMassEdit(['asset-1'])
    savedElsewhere('asset-1', { authors: ['author-theirs'] })
    const readsBefore = batchReads()

    row().keywords = ['keyword-typed']
    await save()

    expect([batchReads() - readsBefore, saved()]).toEqual([
      0,
      [[{ id: 'asset-1', described: true, keywords: ['keyword-typed'] }]],
    ])
    expect(held.get('asset-1')!.authors).toEqual(['author-theirs'])
  })

  it('reads the assets of a request of ten once, before that request', async () => {
    const ids = Array.from({ length: 12 }, (_value, index) => 'asset-' + index)
    ids.forEach((id) => onServer(id, { title: 'first' }))
    const { rows, save } = await pickedForMassEdit(ids)
    const readsBefore = batchReads()

    rows().forEach((row) => (row.customData = { title: 'typed' }))
    await save()

    expect([batchReads() - readsBefore, saved().map((batch) => batch.length)]).toEqual([2, [10, 2]])
  })
})

describe('the bulk save of a mass edit, after another editor deleted the asset', () => {
  it('finds it deleted by the read before it sends custom data: sends nothing, removes its row and says so', async () => {
    onServer('asset-1', { title: 'first' })
    onServer('asset-2', { title: 'first' })
    const { row, rows, pressSave, alerts } = await massEditOverlay(['asset-1', 'asset-2'])
    deletedElsewhere('asset-1')

    row(0).customData = { title: 'typed' }
    row(1).customData = { title: 'typed too' }
    await pressSave()

    expect([saved(), rows().map((one) => one.assetId), alerts()]).toEqual([[], ['asset-2'], [ROW_DELETED]])
    await pressSave()
    expect(saved()).toEqual([[{ id: 'asset-2', described: true, customData: { title: 'typed too' } }]])
  })

  it('finds it deleted by a read after the server failed the save (core-dam answers 500 for it today)', async () => {
    onServer('asset-1', { title: 'first' })
    const { row, rows, pressSave, alerts } = await massEditOverlay(['asset-1'])
    deletedElsewhere('asset-1')

    row().keywords = ['keyword-typed']
    await pressSave()

    expect([saved().length, rows(), alerts()]).toEqual([1, [], [ROW_DELETED]])
  })

  it('takes the one the server names by its id as deleted, without reading', async () => {
    onServer('asset-1', { title: 'first' })
    onServer('asset-2', { title: 'first' })
    const { row, rows, rejection } = await pickedForMassEdit(['asset-1', 'asset-2'])
    server.on('PATCH', BULK, () => {
      throw validationError({ '[1].id': ['error_field_empty'] })
    })
    const readsBefore = batchReads()

    row(0).keywords = ['keyword-typed']
    row(1).keywords = ['keyword-typed']
    const error = (await rejection()) as { assetIds?: string[] }

    expect([error.assetIds, batchReads() - readsBefore]).toEqual([['asset-2'], 0])
    expect(rows()).toHaveLength(2)
  })

  it('keeps the server error of an asset that exists', async () => {
    onServer('asset-1', { title: 'first' })
    const { row, rows, rejection, library } = await pickedForMassEdit(['asset-1'])
    server.on('PATCH', BULK, () => {
      throw httpError(500)
    })

    row().keywords = ['keyword-typed']

    expect(library.isAnzuApiAxiosError(await rejection())).toBe(true)
    expect(rows()).toHaveLength(1)
  })
})

describe('the panel of the list, after another editor saved its asset', () => {
  it('sends only the fields changed here: the authors the other editor added stay', async () => {
    onServer('asset-1', { title: 'first', note: 'first note' })
    const panel = await panelOf('asset-1')
    savedElsewhere('asset-1', { authors: ['author-theirs'] })

    await panel.type(0, 'typed')
    await panel.save()

    expect([held.get('asset-1')!.authors, panel.alerts()]).toEqual([['author-theirs'], [UPDATED]])
    expect(saved()).toEqual([[{ id: 'asset-1', described: true, customData: { title: 'typed', note: 'first note' } }]])
  })

  it('keeps the custom field the other editor changed, shows it, and sends it no more', async () => {
    onServer('asset-1', { title: 'first', note: 'first note' })
    const panel = await panelOf('asset-1')
    savedElsewhere('asset-1', { customData: { title: 'first', note: 'their note' } })

    await panel.type(0, 'typed')
    await panel.save()

    expect(customDataOf('asset-1')).toEqual({ title: 'typed', note: 'their note' })
    expect(panel.shown()).toEqual(['typed', 'their note'])
    await panel.type(0, 'typed again')
    await panel.save()
    expect(saved()[1]).toEqual([
      { id: 'asset-1', described: true, customData: { title: 'typed again', note: 'their note' } },
    ])
  })

  it('shows the authors the other editor added once it saved, and sends them no more', async () => {
    onServer('asset-1', { title: 'first' })
    const panel = await panelOf('asset-1')
    savedElsewhere('asset-1', { authors: ['author-theirs'] })

    await panel.type(0, 'typed')
    await panel.save()

    expect(panel.detail.asset?.authors).toEqual(['author-theirs'])
    await panel.type(0, 'typed again')
    await panel.save()
    expect(saved()[1]).toEqual([{ id: 'asset-1', described: true, customData: { title: 'typed again' } }])
  })
})

describe('the panel of the list, after another editor deleted its asset', () => {
  it('finds it deleted by the read before it sends custom data, says so and turns Save off', async () => {
    onServer('asset-1', { title: 'first' })
    const panel = await panelOf('asset-1')
    deletedElsewhere('asset-1')

    await panel.type(0, 'typed')
    await panel.save()

    expect([saved(), panel.alerts(), panel.saveButton().disabled]).toEqual([[], [DELETED], true])
  })

  it('finds it deleted by a read after the server failed the save', async () => {
    onServer('asset-1', { title: 'first' })
    const panel = await panelOf('asset-1')
    deletedElsewhere('asset-1')

    panel.detail.mainFileSingleUse = true
    await panel.save()

    expect([saved().length, panel.alerts(), panel.saveButton().disabled]).toEqual([1, [DELETED], true])
  })

  it('takes a 404 of the save as deleted once a read finds it gone', async () => {
    onServer('asset-1', { title: 'first' })
    const panel = await panelOf('asset-1')
    server.on('PATCH', BULK, () => {
      deletedElsewhere('asset-1')
      throw httpError(404)
    })

    panel.detail.mainFileSingleUse = true
    await panel.save()

    expect([panel.alerts(), panel.saveButton().disabled]).toEqual([[DELETED], true])
  })

  /*
   * A 404 does not say what is missing: a proxy answers it during a deploy, a server may for a keyword deleted
   * meanwhile. Taken as deleted, the asset showed as being deleted in the list until a reload, and later saves
   * of its queue rows skipped it without a word.
   */
  it('keeps an asset a 404 of its save named, when a read finds it', async () => {
    onServer('asset-1', { title: 'first' })
    const panel = await panelOf('asset-1')
    server.on('PATCH', BULK, () => {
      throw httpError(404)
    })
    const readsBefore = batchReads()
    const { assetDeletedHere } = await import('@/domains/coreDam/asset/api/assetApi')

    panel.detail.mainFileSingleUse = true
    await panel.save()

    expect([panel.alerts(), batchReads() - readsBefore, panel.saveButton().disabled]).toEqual([
      [SYSTEM_ERROR],
      1,
      false,
    ])
    expect(assetDeletedHere('asset-1')).toBe(false)
  })
})
