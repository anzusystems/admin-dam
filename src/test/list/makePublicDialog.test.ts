import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The file of an asset is made public from the menu of its file card, by a dialog. For an audio and a document the
 * dialog asks for the slug of the address the file gets; an image has none. What is sent is not what was typed but
 * the slug made of it, and the server has rules for it: 3 to 128 characters, small letters and digits in groups
 * joined by single hyphens. The real page of the list with its real detail, the application around it as it starts;
 * the server is a fake, and so is the address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const MAKE_PUBLIC = /^\/adm\/v1\/(image|audio|document)\/([^/]+)\/make-public$/

const UPDATED = 'Record was updated'
const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const FIX = 'Please fill all required fields and fix problems'
const REQUIRED = 'Required.'
const TOO_SHORT = 'Minimal length is 3.'
const TOO_LONG = 'Maximal length is 128.'
const PUBLIC = 'File is public'
const PRIVATE = 'File is private'

const LIST = '/assets'
const ASSET = 'asset-2'
const FILE = 'file-2'

type Kind = 'image' | 'document' | 'audio'

/** What the asset is, whether the server holds its file as public, and its title when that is not its id. */
let kind: Kind = 'audio'
let published = false
let titled: string | null = null

const routeOf = (fileId: string) => ({ id: 'route-' + fileId, publicUrl: 'https://dam.test/public/' + fileId })

/** An asset as the server holds it now: the second of the list is the one whose file is made public. */
const onServer = (id: string) => ({
  ...assetDetail(id, {
    attributes: { assetType: id === ASSET ? kind : 'video', assetStatus: 'with_file' },
    texts: { displayTitle: id === ASSET && titled ? titled : id },
    mainFile:
      id === ASSET
        ? { ...assetFile(FILE, 'processed', { asset: id }), mainRoute: published ? routeOf(FILE) : null }
        : assetFile(id.replace('asset', 'file'), 'processed', { asset: id }),
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** What the file card of the detail says of the file: public or private. */
const route = () =>
  Array.from(detail()?.querySelectorAll('.v-chip') ?? [])
    .map((chip) => chip.textContent?.trim())
    .find((text) => text === PUBLIC || text === PRIVATE) ?? null

/** The open dialog, its slug field, and what the field says is wrong with it. */
const dialog = () => dialogButton('Confirm')?.closest<HTMLElement>('.v-dialog') ?? null
const slug = () => dialog()?.querySelector<HTMLInputElement>('input') ?? null
const said = () =>
  Array.from(dialog()?.querySelectorAll('.v-messages__message') ?? []).map((message) => message.textContent?.trim())

/** The slugs the server was asked to make the file public under. */
const sentSlugs = () => server.sent('PATCH', MAKE_PUBLIC).map((request) => JSON.parse(request.data as string).slug)

/** The dialog of "Make public", open over the detail of the asset: of an asset of the kind, its file private. */
const openDialog = async (of: Kind) => {
  kind = of
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update', 'dam_document_update', 'dam_audio_update'],
    customForm: { image: [customField('title')], document: [customField('title')], audio: [customField('title')] },
  })
  // The user as the bar of the page draws them.
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(3)

    return found
  })
  tiles[1].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(route()).toBe(PRIVATE))
  /* With metadata typed into the form and not saved: the detail then stays as it is once the change went through, so
   * no loader takes the dialog away with it - it is gone only when it closes itself. */
  const title = detail()!.querySelector<HTMLTextAreaElement>('textarea')!
  title.value = 'typed and not saved'
  title.dispatchEvent(new Event('input'))
  await nextTick()
  await pressMakePublic()

  return ui
}

/** "Make public" of the menu of the file card pressed - the menu opened first, unless it is still open - and the
 * dialog open. */
const pressMakePublic = async () => {
  const menuIsOpen = () => !!document.body.querySelector('.v-menu.v-overlay--active')
  if (!menuIsOpen()) detail()!.querySelector('.mdi-dots-vertical')!.closest('button')!.click()
  const item = await eventually(() => {
    const found = Array.from(
      document.body.querySelectorAll<HTMLElement>('.v-menu.v-overlay--active .v-list-item')
    ).find((listed) => listed.textContent?.trim() === 'Make public')
    expect(found).toBeTruthy()

    return found!
  })
  item.click()
  await eventually(() => expect(dialog()).not.toBeNull())
}

const typeSlug = async (value: string) => {
  const field = slug()!
  field.value = value
  field.dispatchEvent(new Event('input'))
  await nextTick()

  return field
}

const confirm = async () => {
  dialogButton('Confirm')!.click()
  await settled()
}

beforeEach(() => {
  server = createFakeDam()
  kind = 'audio'
  published = false
  titled = null
  const listed = ['asset-1', ASSET, 'asset-3']
  for (const id of listed) server.assetBy(id, () => onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: listed.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // As core-dam answers a file made public: 200 with its route, for every kind.
  server.on('PATCH', MAKE_PUBLIC, (_request, match) => {
    published = true

    return { status: 200, data: routeOf(match[2]) }
  })
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the dialog that makes the file of an asset public', () => {
  it.each<Kind>(['audio', 'document'])(
    'stays open after a change of a file of the kind "%s" the server refused, with the slug that was typed into it',
    async (of) => {
      let refuse = true
      server.on('PATCH', MAKE_PUBLIC, (_request, match) => {
        if (refuse) throw httpError(500)
        published = true

        return { status: 200, data: routeOf(match[2]) }
      })
      const ui = await openDialog(of)
      // Offered as the slug of the title of the asset; the user types their own.
      expect(slug()?.value).toBe(ASSET)
      const typedInto = await typeSlug('a-slug-of-my-own')

      await confirm()

      expect([sentSlugs(), ui.alerts(), route(), server.assetReads(ASSET)]).toEqual([
        ['a-slug-of-my-own'],
        [SYSTEM_ERROR],
        PRIVATE,
        1,
      ])
      expect([slug() === typedInto, typedInto.isConnected, typedInto.value, said()]).toEqual([
        true,
        true,
        'a-slug-of-my-own',
        [],
      ])
      expect(dialogButton('Confirm')!.classList.contains('v-btn--loading')).toBe(false)

      // Tried again, as it is: the dialog goes once the change went through.
      refuse = false
      await confirm()
      await eventually(() => expect(dialog()).toBeNull())

      expect([sentSlugs(), route(), server.assetReads(ASSET)]).toEqual([
        ['a-slug-of-my-own', 'a-slug-of-my-own'],
        PUBLIC,
        2,
      ])
      expect(ui.alerts()).toEqual([SYSTEM_ERROR, UPDATED])
    }
  )

  // The dialog of an image only asks: it has no slug, and nothing of it is checked. It stays for another try as well.
  it('asks for no slug of an image, and stays open after a refusal as the others do', async () => {
    let refuse = true
    server.on('PATCH', MAKE_PUBLIC, (_request, match) => {
      if (refuse) throw httpError(500)
      published = true

      return { status: 200, data: routeOf(match[2]) }
    })
    const ui = await openDialog('image')
    expect(slug()).toBeNull()

    await confirm()

    expect([dialog() === null, ui.alerts(), route()]).toEqual([false, [SYSTEM_ERROR], PRIVATE])

    refuse = false
    await confirm()
    await eventually(() => expect(dialog()).toBeNull())

    expect(server.sent('PATCH', MAKE_PUBLIC).map((request) => [request.url, request.data])).toEqual([
      ['/adm/v1/image/file-2/make-public', undefined],
      ['/adm/v1/image/file-2/make-public', undefined],
    ])
    expect(route()).toBe(PUBLIC)
  })

  /* Three characters typed can make a slug of two, and letters the slug has no use for make none: the server refused
   * those, and the user was told only that something went wrong. */
  it.each<[string, string, string]>([
    ['of two characters, made of three typed', 'ab!', TOO_SHORT],
    ['empty, made of letters it has no use for', 'Заголовок', REQUIRED],
    ['empty, with nothing typed', '', REQUIRED],
    ['of 129 characters', 'a'.repeat(129), TOO_LONG],
  ])('sends nothing while the slug it would send is %s: the field says so', async (_what, typed, error) => {
    const ui = await openDialog('audio')
    const typedInto = await typeSlug(typed)

    await confirm()

    expect([sentSlugs(), said(), ui.alerts()]).toEqual([[], [error], [FIX]])
    // The dialog is there to be put right, and the field holds what was typed.
    expect([slug() === typedInto, typedInto.value, route(), server.assetReads(ASSET)]).toEqual([
      true,
      typed,
      PRIVATE,
      1,
    ])

    await typeSlug('put right')
    await confirm()
    await eventually(() => expect(dialog()).toBeNull())

    expect([sentSlugs(), route()]).toEqual([['put-right'], PUBLIC])
  })

  // The guard of the rule: it is the slug that is measured, so what was typed can be longer, and of other letters.
  it.each<[string, string, string]>([
    ['capitals, spaces and marks', 'Môj Podcast, #3!', 'moj-podcast-3'],
    ['more than 128 characters typed', 'a' + ' '.repeat(130) + 'b c', 'a-b-c'],
    ['128 characters', 'a'.repeat(128), 'a'.repeat(128)],
    ['three characters', 'a b', 'a-b'],
  ])('sends the slug made of what was typed, and leaves the field as typed: %s', async (_what, typed, sent) => {
    const ui = await openDialog('document')
    const typedInto = await typeSlug(typed)
    // Not rewritten under the hands of the user.
    expect([typedInto.value, said()]).toEqual([typed, []])

    await confirm()
    await eventually(() => expect(dialog()).toBeNull())

    expect([sentSlugs(), route(), ui.alerts()]).toEqual([[sent], PUBLIC, [UPDATED]])
  })

  /* The form says what is wrong with its slug only once it was confirmed. It went on as confirmed after the dialog
   * was closed: opened again, it said so of the slug it offers, before anybody confirmed that. */
  it('says nothing of the slug it offers as it is opened again, after a confirm it would not send', async () => {
    // The slug of this title is too short to be sent.
    titled = 'ab'
    const ui = await openDialog('audio')
    expect([slug()?.value, said()]).toEqual(['ab', []])
    await confirm()
    expect([sentSlugs(), said(), ui.alerts()]).toEqual([[], [TOO_SHORT], [FIX]])

    dialogButton('Cancel')!.click()
    await eventually(() => expect(dialog()).toBeNull())
    await pressMakePublic()

    expect([slug()?.value, said()]).toEqual(['ab', []])
    // And says it as that is confirmed.
    await confirm()
    expect([sentSlugs(), said()]).toEqual([[], [TOO_SHORT]])
  })
})
