import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import { createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, customField, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/* A row of the editable queue - the card with a picture, the buttons and the metadata form of one upload - by the
 * state of its row in the store: which buttons it offers and when, what it says over its picture, and what its
 * form holds. The real list, row and form over the real store, with the application around them as it starts;
 * the server is a fake, and is asked only for the names of keywords and authors.
 *
 * What the buttons do when pressed is in `queueRowActions.test.ts`. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const QUEUE = 'global'
const SECOND = 1000
const REFRESH = 'Refresh'
const CANCEL = 'Cancel'
const DELETE = 'Delete'
const EDIT = 'Edit more'
const UNKNOWN_ERROR = 'System error. Try again later or contact an administrator.'

const NO_ERROR: UploadQueueItem['error'] = { hasError: false, message: '', assetFileFailReason: 'none' }
const error = (message: string, assetFileFailReason = 'none') =>
  ({ hasError: true, message, assetFileFailReason }) as UploadQueueItem['error']

const text = (element: Element | null | undefined) => element?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

/** The texts under the element, piece by piece as they are drawn. */
const texts = (element: Element | null | undefined) => {
  const found: string[] = []
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const piece = node.textContent?.replace(/\s+/g, ' ').trim()
      if (piece) found.push(piece)
    }
    node.childNodes.forEach(walk)
  }
  if (element) walk(element)

  return found
}

/** Mounts the editable list of the queue over the rows and answers what the card of each row shows. */
const mountQueue = async (rows: UploadQueueItem[], setup: Partial<UploadUiSetup> = {}, props: object = {}) => {
  const ui = await startUploadUi({ server, queues: { [QUEUE]: rows }, ...setup })
  const list = await ui.mount(() => import('@/domains/coreDam/asset/components/queue/AssetQueueEditable.vue'), {
    queueId: QUEUE,
    massOperations: true,
    ...props,
  })
  // The one place that knows how a card is built.
  const card = (index = 0) => {
    const element = list.querySelectorAll<HTMLElement>('.dam-upload-queue__item')[index]
    const button = (name: string) => buttonsNamed(element, name)[0] ?? null
    const form = element.querySelector<HTMLFormElement>('form')!
    const fields = () =>
      Array.from(form.querySelectorAll<HTMLElement>('.v-input')).map((input) => ({
        input,
        label: text(input.querySelector('label')),
        // Behind "show more details" a field is kept, and hidden.
        shown: !input.closest<HTMLElement>('[style*="display: none"]'),
      }))

    return {
      element,
      button,
      offers: () => [REFRESH, CANCEL].filter((name) => button(name)),
      picture: () => texts(element.querySelector('.asset-image')),
      duplicate: () => element.querySelector<HTMLElement>('.dam-upload-queue__overlay--warning'),
      error: () => element.querySelector<HTMLElement>('.dam-upload-queue__overlay--error'),
      form,
      fields,
      shownFields: () =>
        fields()
          .filter((field) => field.shown)
          .map((field) => field.label),
      field: (label: string) => fields().find((field) => field.label === label)?.input ?? null,
      toggle: () => form.querySelector<HTMLInputElement>('input[type="checkbox"]')!,
    }
  }

  return { ...ui, rows: ui.rows[QUEUE], list, card }
}

const after = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms)
  await nextTick()
}

beforeEach(() => {
  server = createFakeDam()
  // The names of the keywords and the authors the rows hold: none is known here.
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, () => ({ status: 200, data: { data: [] } }))
})

afterEach(() => {
  stopUploadUi()
})

describe('the cancel button of a row', () => {
  it.each(['loading', 'waiting', 'uploading', 'processing', 'failed'] as const)(
    'is there for a row that is %s',
    async (status) => {
      const { card } = await mountQueue([queueRow({ status })])

      expect(card().button(CANCEL)).not.toBeNull()
    }
  )

  it.each(['uploaded', 'stop'] as const)('is not there for a row that is %s', async (status) => {
    const { card } = await mountQueue([queueRow({ status })])

    expect(card().button(CANCEL)).toBeNull()
  })

  it('goes when the row is settled, and comes back when the row fails after all', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'processing' })])

    rows[0].status = 'uploaded'
    await nextTick()
    expect(card().button(CANCEL)).toBeNull()

    rows[0].status = 'failed'
    await nextTick()
    expect(card().button(CANCEL)).not.toBeNull()
  })
})

describe('the refresh button of a row that is under way', () => {
  it.each(['uploading', 'processing'] as const)(
    'comes once the row has been %s for twenty seconds, not sooner',
    async (status) => {
      const { card } = await mountQueue([queueRow({ status })])
      expect(card().button(REFRESH)).toBeNull()

      await after(20 * SECOND - 1)
      expect(card().button(REFRESH)).toBeNull()

      await after(1)
      expect(card().button(REFRESH)).not.toBeNull()
    }
  )

  it('counts the twenty seconds from the last change of the status of the row', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploading' })])
    await after(15 * SECOND)

    rows[0].status = 'processing'
    await after(15 * SECOND)
    expect(card().button(REFRESH)).toBeNull()

    await after(5 * SECOND)
    expect(card().button(REFRESH)).not.toBeNull()
  })

  it('does not come for a row that was settled, with its metadata, before the twenty seconds were over', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploading' })])
    await after(10 * SECOND)

    rows[0].canEditMetadata = true
    rows[0].status = 'uploaded'
    await after(60 * SECOND)

    expect(card().button(REFRESH)).toBeNull()
  })

  it.each(['waiting', 'loading'] as const)('does not come for a row that is only %s, however long', async (status) => {
    const { card } = await mountQueue([queueRow({ status })])

    await after(60 * SECOND)

    expect(card().button(REFRESH)).toBeNull()
  })

  it('goes away when the row fails after it was offered', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'processing' })])
    await after(20 * SECOND)
    expect(card().offers()).toEqual([REFRESH, CANCEL])

    rows[0].error = error('', 'unknown')
    rows[0].status = 'failed'
    await after(60 * SECOND)

    expect(card().offers()).toEqual([CANCEL])
  })
})

describe('the refresh button of a row that is uploaded', () => {
  it('is there at once when the row has an error', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', error: error('Metadata could not be loaded.') })])

    expect(card().offers()).toEqual([REFRESH])
  })

  it('is there the moment a row that was under way is settled with an error', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'processing' })])

    rows[0].error = error('Metadata could not be loaded.')
    rows[0].status = 'uploaded'
    await nextTick()

    expect(card().offers()).toEqual([REFRESH])
  })

  it('comes after twenty seconds for a row that still has no metadata', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded' })])
    expect(card().button(REFRESH)).toBeNull()

    await after(20 * SECOND - 1)
    expect(card().button(REFRESH)).toBeNull()

    await after(1)
    expect(card().button(REFRESH)).not.toBeNull()
  })

  it('does not come for a row whose metadata arrives within the twenty seconds', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploaded' })])
    await after(10 * SECOND)

    rows[0].canEditMetadata = true
    await after(60 * SECOND)

    expect(card().button(REFRESH)).toBeNull()
  })

  it('goes away when the metadata of the row arrives after it was offered', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploaded' })])
    await after(20 * SECOND)
    expect(card().button(REFRESH)).not.toBeNull()

    rows[0].canEditMetadata = true
    await nextTick()

    expect(card().button(REFRESH)).toBeNull()
  })

  it('stays on a row with an error, also when its metadata arrives', async () => {
    const { card, rows } = await mountQueue([
      queueRow({ status: 'uploaded', error: error('Processing is taking too long.') }),
    ])

    rows[0].canEditMetadata = true
    await after(60 * SECOND)

    expect(card().button(REFRESH)).not.toBeNull()
  })

  it('never comes for a row that has its metadata', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', canEditMetadata: true })])

    await after(60 * SECOND)

    expect(card().offers()).toEqual([])
  })

  // A duplicate is given no metadata to edit, so there is nothing a refresh could bring.
  it('never comes for a duplicate, which never gets metadata', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', isDuplicate: true })])

    await after(60 * SECOND)

    expect(card().offers()).toEqual([])
  })
})

describe('the refresh button of a row that is failed or stopped', () => {
  it.each(['failed', 'stop'] as const)('never comes for a row that is %s', async (status) => {
    const { card } = await mountQueue([queueRow({ status, error: error('', 'invalid_size') })])

    await after(60 * SECOND)

    expect(card().button(REFRESH)).toBeNull()
  })
})

describe('the delete button of a row', () => {
  const states: Array<[string, Partial<UploadQueueItem>, boolean]> = [
    ['an uploaded row with its metadata', { status: 'uploaded', canEditMetadata: true }, true],
    ['a row still uploading whose metadata is here already', { status: 'uploading', canEditMetadata: true }, true],
    ['a duplicate', { status: 'uploaded', isDuplicate: true }, true],
    ['an uploaded row without its metadata', { status: 'uploaded' }, false],
    ['a row that is processing', { status: 'processing' }, false],
    ['a row that waits', { status: 'waiting', assetId: null, fileId: null }, false],
    ['a failed row', { status: 'failed', error: error('', 'unknown') }, false],
  ]

  it.each(states)('is there for %s, and whether it can be pressed', async (_name, over, enabled) => {
    const { card } = await mountQueue([queueRow(over)])

    expect(card().button(DELETE)).not.toBeNull()
    expect(!card().button(DELETE)?.disabled).toBe(enabled)
  })

  it('is not there for a user who may not delete assets', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', canEditMetadata: true })], {
      grants: ['dam_asset_update'],
    })

    expect(card().button(DELETE)).toBeNull()
    expect(card().button(EDIT)).not.toBeNull()
  })
})

describe('the button of a row that copies the id of its asset', () => {
  it('is there once the row has an asset, not before', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'waiting', assetId: null, fileId: null })])
    expect(card().button('Copy Asset ID')).toBeNull()

    // The answer to the start request of the upload names the asset.
    rows[0].assetId = 'asset-1'
    await nextTick()

    expect(card().button('Copy Asset ID')).not.toBeNull()
  })
})

describe('the edit button of a row', () => {
  it('can be pressed only once the metadata of the row can be edited', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploaded' })])
    expect(card().button(EDIT)?.disabled).toBe(true)

    rows[0].canEditMetadata = true
    await nextTick()

    expect(card().button(EDIT)?.disabled).toBe(false)
  })

  it('is not there on a duplicate', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', isDuplicate: true })])

    expect(card().button(EDIT)).toBeNull()
  })
})

describe('the picture of a row', () => {
  it('says the row waits', async () => {
    const { card } = await mountQueue([queueRow({ status: 'waiting' })])

    expect(card().picture()).toEqual(['Waiting'])
  })

  it('says the row is uploading, with how far it is and how long it will take', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploading' })])
    expect(card().picture()).toEqual(['0%', 'Uploading'])

    rows[0].progress = { progressPercent: 40.2, remainingTime: 42, speed: 1000 }
    await nextTick()

    expect(card().picture()).toEqual(['41%', 'Uploading', '42 s'])
  })

  it.each(['processing', 'loading'] as const)('says the server is processing a row that is %s', async (status) => {
    const { card } = await mountQueue([queueRow({ status })])

    expect(card().picture()).toEqual(['Processing'])
  })

  it('says a settled row is done', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', assetStatus: 'with_file' })])

    expect(card().picture()).toEqual(['Done'])
  })

  // The queue of the assets picked for mass edit: nothing was uploaded there.
  it('does not say "done" where the list is told to leave that out', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded' })], {}, { disableDoneAnimation: true })

    expect(card().picture()).toEqual([])
  })

  it('says nothing of a failed row', async () => {
    const { card } = await mountQueue([queueRow({ status: 'failed', error: error('', 'unknown') })])

    expect(card().picture()).toEqual([])
  })
})

describe('a row that is a duplicate', () => {
  it('says so over its picture and links to the original asset, in a new tab', async () => {
    const { card } = await mountQueue([
      queueRow({ status: 'uploaded', isDuplicate: true, duplicateAssetId: 'asset-original' }),
    ])

    expect(texts(card().duplicate())).toEqual(['Duplicate', 'View original'])
    const link = card().duplicate()?.querySelector('a')
    expect([link?.getAttribute('href'), link?.getAttribute('target')]).toEqual(['/assets/asset-original', '_blank'])
  })

  it('says so without a link while the original is not known', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', isDuplicate: true })])

    expect(texts(card().duplicate())).toEqual(['Duplicate'])
    expect(card().duplicate()?.querySelector('a')).toBeNull()
  })

  it('is not said of any other row', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', duplicateAssetId: 'asset-original' })])

    expect(card().duplicate()).toBeNull()
  })
})

describe('a row with an error', () => {
  it('shows the message of the row', async () => {
    const { card } = await mountQueue([queueRow({ status: 'failed', error: error('Incorrect file format') })])

    expect(texts(card().error())).toEqual(['Error', 'Incorrect file format'])
  })

  const reasons: Array<[string, string]> = [
    ['unknown', 'Unknown'],
    ['invalid_checksum', 'Invalid checksum'],
    ['invalid_mime_type', 'Invalid mime type'],
    ['download_failed', 'Download failed'],
    ['invalid_size', 'Invalid size'],
  ]

  it.each(reasons)(
    'shows the reason "%s" of the server as a chip when the row has no message',
    async (reason, title) => {
      const { card } = await mountQueue([queueRow({ status: 'failed', error: error('', reason) })])

      expect(texts(card().error())).toEqual(['Error', title])
      expect(text(card().error()?.querySelector('.v-chip'))).toBe(title)
    }
  )

  it('shows the message, and no chip, when the row has both', async () => {
    const { card } = await mountQueue([
      queueRow({ status: 'failed', error: error('Incorrect file format', 'invalid_mime_type') }),
    ])

    expect(texts(card().error())).toEqual(['Error', 'Incorrect file format'])
    expect(card().error()?.querySelector('.v-chip')).toBeNull()
  })

  it('says the error is unknown when the row has neither a message nor a reason', async () => {
    const { card } = await mountQueue([queueRow({ status: 'failed', error: error('') })])

    expect(texts(card().error())).toEqual(['Error', UNKNOWN_ERROR])
  })

  it('is shown whatever the status of the row: a warning on an uploaded row as well', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', error: error('Metadata could not be loaded.') })])

    expect(texts(card().error())).toEqual(['Error', 'Metadata could not be loaded.'])
  })

  it('is not shown on a row without one, whatever message or reason the row still carries', async () => {
    const { card } = await mountQueue([
      queueRow({ status: 'uploaded', error: { ...NO_ERROR, message: 'stale', assetFileFailReason: 'unknown' } }),
    ])

    expect(card().error()).toBeNull()
  })
})

describe('the form of a row', () => {
  const form = { image: [customField('title'), customField('description'), customField('note')] }
  const disabled = (form: HTMLFormElement) =>
    Array.from(form.querySelectorAll<HTMLInputElement>('textarea:not([readonly]), input:not([type="hidden"])')).map(
      (input) => input.disabled
    )

  it('is disabled until the metadata of the row can be edited', async () => {
    const { card, rows } = await mountQueue([queueRow({ status: 'uploaded' })], { customForm: form })
    expect(new Set(disabled(card().form))).toEqual(new Set([true]))

    rows[0].canEditMetadata = true
    await nextTick()
    await nextTick()

    expect(new Set(disabled(card().form))).toEqual(new Set([false]))
  })

  it('is disabled on a duplicate, whatever the row says of its metadata', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', isDuplicate: true, canEditMetadata: true })], {
      customForm: form,
    })

    // The custom fields and the switch: the keyword and author inputs go by the metadata of the row alone.
    const custom = ['title', 'description'].map((label) => card().field(label)?.querySelector('textarea')?.disabled)
    expect([...custom, card().toggle().disabled]).toEqual([true, true, true])
  })

  it('holds the custom fields the ext system pins, then keywords, authors and the single-use switch', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', canEditMetadata: true })], { customForm: form })

    expect(card().shownFields()).toEqual(['title', 'description', 'Keywords', 'Authors', 'Single-use license'])
    // The third custom field waits behind the button.
    expect(
      card()
        .fields()
        .map((field) => field.label)
    ).toContain('note')
    expect(card().button('Show more details')).not.toBeNull()
  })

  it('holds the custom fields of the asset type of the row, not those of another type', async () => {
    const { card } = await mountQueue([queueRow({ status: 'uploaded', canEditMetadata: true, assetType: 'audio' })], {
      customForm: { image: [customField('title')], audio: [customField('album')] },
    })

    expect(card().shownFields()).toEqual(['album', 'Keywords', 'Authors', 'Single-use license'])
  })

  it('has keywords and authors only where the ext system has them on for the asset type of the row', async () => {
    const { card } = await mountQueue(
      [
        queueRow({ status: 'uploaded', canEditMetadata: true, assetType: 'image' }),
        queueRow({ status: 'uploaded', canEditMetadata: true, assetType: 'document', assetId: 'asset-2' }),
        queueRow({ status: 'uploaded', canEditMetadata: true, assetType: 'video', assetId: 'asset-3' }),
      ],
      {
        extSystem: {
          image: { keywords: { enabled: true, required: false }, authors: { enabled: false, required: false } },
          document: { keywords: { enabled: false, required: false }, authors: { enabled: true, required: false } },
          video: { keywords: undefined, authors: undefined },
        },
      }
    )

    expect(card(0).shownFields()).toEqual(['Keywords', 'Single-use license'])
    expect(card(1).shownFields()).toEqual(['Authors', 'Single-use license'])
    expect(card(2).shownFields()).toEqual(['Single-use license'])
  })

  it('writes what is typed into a custom field into the row, and keeps the other values of the row', async () => {
    const { card, rows } = await mountQueue(
      [queueRow({ status: 'uploaded', canEditMetadata: true, customData: { description: 'kept', hidden: 1 } })],
      { customForm: form }
    )
    const title = card().field('title')!.querySelector('textarea')!

    title.value = 'typed'
    title.dispatchEvent(new Event('input'))
    await nextTick()

    expect(rows[0].customData).toEqual({ title: 'typed', description: 'kept', hidden: 1 })
    expect(card().field('description')!.querySelector('textarea')!.value).toBe('kept')
  })

  it('shows the single-use switch as the row has it, and writes a change of it into the row', async () => {
    const { card, rows } = await mountQueue([
      queueRow({ status: 'uploaded', canEditMetadata: true, mainFileSingleUse: true }),
      queueRow({ status: 'uploaded', canEditMetadata: true, mainFileSingleUse: null, assetId: 'asset-2' }),
    ])
    expect([card(0).toggle().checked, card(1).toggle().checked]).toEqual([true, false])

    card(1).toggle().click()
    await nextTick()

    expect([rows[0].mainFileSingleUse, rows[1].mainFileSingleUse]).toEqual([true, true])

    card(0).toggle().click()
    await nextTick()

    expect([rows[0].mainFileSingleUse, rows[1].mainFileSingleUse]).toEqual([false, true])
  })

  it('names the original file and its size above the form, when the row has a title', async () => {
    const { card } = await mountQueue([
      queueRow({
        status: 'uploading',
        displayTitle: 'photo.jpg',
        file: new File([new Uint8Array(2048)], 'photo.jpg', { type: 'image/jpeg' }),
      }),
      // An asset picked for mass edit has a title and no file.
      queueRow({ type: 'asset', status: 'uploaded', displayTitle: 'An asset', assetId: 'asset-2' }),
      queueRow({ status: 'uploaded', displayTitle: '', assetId: 'asset-3' }),
    ])

    const named = (index: number) => texts(card(index).element).filter((piece) => /Original name|\(/.test(piece))
    expect(named(0)).toEqual(['Original name: photo.jpg', '(2 KB)'])
    expect(named(1)).toEqual(['Original name: An asset'])
    expect(named(2)).toEqual([])
  })
})
