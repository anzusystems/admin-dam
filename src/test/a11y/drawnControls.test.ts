import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, provide, reactive, ref } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUi } from '@/test/support/uploadUi'

/*
 * Checks what the page gives a screen reader for controls that
 * state a state and for controls that are not Vuetify buttons.
 * `iconButtonTooltips.test.ts` reads the templates; these cases check what is rendered.
 * Uses the real components with the app initialised in English, over a fake server.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const listItem = (id: string) => ({
  id,
  texts: { displayTitle: id, description: '' },
  attributes: { assetType: 'image', assetStatus: 'with_file' },
  flags: { described: true, visible: true },
  licence: 1,
  mainFile: null,
  podcasts: [],
  assetFileProperties: { distributesInServices: [], slotNames: [], fromRss: false, width: 0, height: 0 },
  mainFileSingleUse: false,
  mainFileInternal: false,
  mainFileOverrideInternal: false,
  createdAt: '2026-10-18T10:00:00.000000Z',
  modifiedAt: '2026-10-18T10:00:00.000000Z',
  createdBy: null,
  modifiedBy: null,
  _resourceName: 'asset',
  _system: 'dam',
})

const listWithPick = async () => {
  const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
  const store = useAssetListStore()
  store.setList([listItem('asset-1'), listItem('asset-2')] as never)
  store.toggleSelectedByIndex(1)
}

/**
 * Colour filter over three colours, one of them without a name in the app, as its filter form provides it.
 * With `inForm`, it is mounted inside that form, which searches on Enter, and the searches are counted.
 */
const mountColours = async (ui: UploadUi, inForm = false) => {
  const config = ui.library.useDamConfigStore()
  config.damPrvConfig = { ...config.damPrvConfig, colorSet: { red: '#ff0000', blue: '#0000ff', teal: '#008080' } }
  const data = reactive<{ color: string[] }>({ color: [] })
  const { default: FilterClosestColor } = await import('@/domains/coreDam/shared/components/FilterClosestColor.vue')
  const searched = ref(0)
  const Filter = defineComponent(() => {
    provide(ui.library.FilterConfigKey, { fields: { color: { default: [], titleT: undefined } } } as never)
    provide(ui.library.FilterDataKey, data as never)
    const filter = () => h(FilterClosestColor, { name: 'color' })

    return () =>
      inForm ? h(ui.library.AFilterWrapperSidebar, { onSubmit: () => searched.value++ }, { default: filter }) : filter()
  })
  const root = await ui.mount(async () => ({ default: Filter }))

  return {
    data,
    searched,
    form: () => root.querySelector('form')!,
    swatches: () => Array.from(root.querySelectorAll<HTMLElement>('.color-swatches__item')),
  }
}

const key = (type: 'keydown' | 'keyup', name: string) =>
  new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true })

const tooltipOf = async (element: HTMLElement) => {
  element.dispatchEvent(new MouseEvent('mouseenter'))
  await vi.advanceTimersByTimeAsync(1000)
  const said = Array.from(document.body.querySelectorAll('.v-tooltip.v-overlay--active .v-overlay__content'))
    .map((tooltip) => tooltip.textContent?.trim())
    .join(' + ')
  element.dispatchEvent(new MouseEvent('mouseleave'))
  await vi.advanceTimersByTimeAsync(1000)

  return said
}

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the controls of the page as a screen reader gets them', () => {
  it('a tile names its select button and says whether it is picked', async () => {
    const ui = await startUploadUi({ server })
    await listWithPick()
    const list = await ui.mount(
      () => import('@/domains/coreDam/asset/components/list/components/AssetListTilesView.vue')
    )
    await nextTick()

    const selects = Array.from(list.querySelectorAll('.dam-image-grid__item')).map((tile) =>
      Array.from(tile.querySelectorAll('button[aria-pressed]'), (button) => [
        button.getAttribute('aria-label'),
        button.getAttribute('aria-pressed'),
      ])
    )
    expect(selects).toEqual([[['Toggle select', 'false']], [['Toggle select', 'true']]])
  })

  it('a row of the table names its checkbox', async () => {
    const ui = await startUploadUi({ server })
    await listWithPick()
    const list = await ui.mount(
      () => import('@/domains/coreDam/asset/components/list/components/AssetListTableView.vue')
    )
    await nextTick()

    const boxes = Array.from(list.querySelectorAll<HTMLInputElement>('tr.a-table__row input[type="checkbox"]'))
    expect(boxes.map((box) => [box.getAttribute('aria-label'), box.checked])).toEqual([
      ['Toggle select', false],
      ['Toggle select', true],
    ])
  })

  it('a colour of the filter is a button, named by the name of its colour, that says whether it is chosen', async () => {
    const { swatches } = await mountColours(await startUploadUi({ server }))

    expect(
      swatches().map((swatch) =>
        ['role', 'tabindex', 'title', 'aria-label', 'aria-pressed'].map((name) => swatch.getAttribute(name))
      )
    ).toEqual([
      ['button', '0', null, 'Red', 'false'],
      ['button', '0', null, 'Blue', 'false'],
      ['button', '0', null, 'teal', 'false'],
    ])
  })

  it('a colour of the filter says its name and its code in one tooltip, in the language of the user', async () => {
    const { swatches } = await mountColours(await startUploadUi({ server }))
    const said = async () => {
      const tooltips: string[] = []
      for (const swatch of swatches()) tooltips.push(await tooltipOf(swatch))

      return [tooltips, swatches().map((swatch) => swatch.getAttribute('aria-label'))]
    }

    expect(await said()).toEqual([
      ['Red (#ff0000)', 'Blue (#0000ff)', 'teal (#008080)'],
      ['Red', 'Blue', 'teal'],
    ])
    const { i18n } = await import('@/plugins/i18n')
    i18n.global.setLocaleMessage('sk', (await import('@/locales/sk')).default as never)
    i18n.global.locale.value = 'sk' as never
    await nextTick()
    expect(await said()).toEqual([
      ['Červená (#ff0000)', 'Modrá (#0000ff)', 'teal (#008080)'],
      ['Červená', 'Modrá', 'teal'],
    ])
  })

  // Button keys: Enter acts on keydown, Space on keyup. Space on keydown only prevents page scroll.
  it('a colour of the filter is chosen and let go by the keys of a button', async () => {
    const { data, swatches } = await mountColours(await startUploadUi({ server }))
    const pressed = () => swatches().map((swatch) => swatch.getAttribute('aria-pressed'))

    const enter = key('keydown', 'Enter')
    swatches()[1]!.dispatchEvent(enter)
    await nextTick()
    expect([enter.defaultPrevented, data.color, pressed()]).toEqual([true, ['#0000ff'], ['false', 'true', 'false']])

    const down = key('keydown', ' ')
    swatches()[1]!.dispatchEvent(down)
    await nextTick()
    expect([down.defaultPrevented, data.color]).toEqual([true, ['#0000ff']])
    swatches()[1]!.dispatchEvent(key('keyup', ' '))
    await nextTick()
    expect([data.color, pressed()]).toEqual([[], ['false', 'false', 'false']])

    const tab = key('keydown', 'Tab')
    swatches()[0]!.dispatchEvent(tab)
    await nextTick()
    expect([tab.defaultPrevented, data.color]).toEqual([false, []])
  })

  // The form searches on Enter keyup (`AFilterWrapperSidebar`). The colour must swallow that key, as it does for Space.
  it('a colour of the filter chosen by Enter does not set off the search of its form', async () => {
    const { data, searched, form, swatches } = await mountColours(await startUploadUi({ server }), true)

    swatches()[0]!.dispatchEvent(key('keydown', 'Enter'))
    const up = key('keyup', 'Enter')
    swatches()[0]!.dispatchEvent(up)
    await nextTick()
    expect([data.color, up.defaultPrevented, searched.value]).toEqual([['#ff0000'], true, 0])
    form().dispatchEvent(key('keyup', 'Enter'))
    await nextTick()
    expect(searched.value).toBe(1)
  })

  // The browser presses a button with Enter and Space. The file input it opens stays hidden.
  it('an upload button of each kind is reached by Tab and opens the file picker', async () => {
    const ui = await startUploadUi({ server })
    const said: unknown[] = []
    for (const variant of ['button', 'icon', 'slot-upload']) {
      const upload = await ui.mount(() => import('@/domains/coreDam/shared/components/FileUpload.vue'), {
        fileInputKey: 0,
        variant,
        buttonText: 'Upload',
      })
      const button = upload.querySelector('button')!
      const input = upload.querySelector<HTMLInputElement>('input[type="file"]')!
      const picker = vi.spyOn(input, 'click').mockImplementation(() => undefined)
      button.click()
      said.push([variant, button.type, button.tabIndex, picker.mock.calls.length, input.hidden, input.tabIndex])
    }

    expect(said).toEqual([
      ['button', 'button', 0, 1, true, -1],
      ['icon', 'button', 0, 1, true, -1],
      ['slot-upload', 'button', 0, 1, true, -1],
    ])
  })

  it('"Advanced" of the licence switch is a button that says whether what it shows is shown', async () => {
    const ui = await startUploadUi({ server })
    const shown = ref(false)
    const { default: ABtnAdvanced } = await import('@/domains/coreDam/shared/components/ABtnAdvanced.vue')
    const Advanced = defineComponent(
      () => () =>
        h(ABtnAdvanced, { modelValue: shown.value, 'onUpdate:modelValue': (value: boolean) => (shown.value = value) })
    )
    const root = await ui.mount(async () => ({ default: Advanced }))
    const button = root.querySelector<HTMLElement>('.cursor-pointer')!
    const said = () => [button.getAttribute('aria-expanded'), shown.value]

    expect([button.getAttribute('role'), button.tabIndex, button.textContent?.trim(), ...said()]).toEqual([
      'button',
      0,
      'Advanced',
      'false',
      false,
    ])
    button.dispatchEvent(key('keydown', 'Enter'))
    const up = key('keyup', 'Enter')
    button.dispatchEvent(up)
    await nextTick()
    expect([...said(), up.defaultPrevented]).toEqual(['true', true, true])
    const down = key('keydown', ' ')
    button.dispatchEvent(down)
    await nextTick()
    expect([...said(), down.defaultPrevented]).toEqual(['true', true, true])
    button.dispatchEvent(key('keyup', ' '))
    await nextTick()
    expect(said()).toEqual(['false', false])
    button.click()
    await nextTick()
    expect(said()).toEqual(['true', true])
  })

  it('the views of the list say which one is shown', async () => {
    const ui = await startUploadUi({ server })
    const toggle = await ui.mount(() => import('@/domains/system/components/GridViewToggle.vue'))
    const views = () =>
      Array.from(toggle.querySelectorAll('button'), (button) => [
        button.getAttribute('aria-label'),
        button.getAttribute('aria-pressed'),
      ])

    expect(views()).toEqual([
      ['Masonry', 'true'],
      ['Grid', 'false'],
      ['List', 'false'],
    ])
    toggle.querySelectorAll('button')[1]!.click()
    await nextTick()
    expect(views()).toEqual([
      ['Masonry', 'false'],
      ['Grid', 'true'],
      ['List', 'false'],
    ])
  })

  /*
   * Button keys: Enter acts on keydown, Space on keyup. The icon keeps the key: neither the
   * field nor its form (which searches on its own submit) gets it, so each key searches once.
   */
  it('the search icon of the list searches by Enter and by Space, once each', async () => {
    server.on('GET', SEARCH, () => ({ status: 200, data: { data: [], hasNextPage: false } }))
    const ui = await startUploadUi({ server })
    const toolbar = await ui.mount(() => import('@/domains/coreDam/asset/components/toolbar/AssetToolbarSearch.vue'))
    const icon = toolbar.querySelector<HTMLElement>('.mdi-magnify')!
    const reached: string[] = []
    const form = toolbar.querySelector('form')!
    form.addEventListener('keydown', (event) => reached.push('keydown ' + event.key))
    form.addEventListener('keyup', (event) => reached.push('keyup ' + event.key))
    const searches = () => server.sent('GET', SEARCH).length

    const enter = key('keydown', 'Enter')
    icon.dispatchEvent(enter)
    const enterUp = key('keyup', 'Enter')
    icon.dispatchEvent(enterUp)
    await vi.advanceTimersByTimeAsync(100)
    expect([searches(), enter.defaultPrevented, enterUp.defaultPrevented]).toEqual([1, true, true])

    const down = key('keydown', ' ')
    icon.dispatchEvent(down)
    await vi.advanceTimersByTimeAsync(100)
    expect([searches(), down.defaultPrevented]).toEqual([1, true])
    icon.dispatchEvent(key('keyup', ' '))
    await vi.advanceTimersByTimeAsync(100)
    expect([searches(), reached]).toEqual([2, []])
  })

  it('the search icon of the list is a named button', async () => {
    const ui = await startUploadUi({ server })
    const field = await ui.mount(() => import('@/domains/coreDam/asset/components/toolbar/AssetSearchInput.vue'), {
      modelValue: '',
    })

    const icon = field.querySelector('.mdi-magnify')
    expect(['role', 'tabindex', 'aria-label'].map((name) => icon?.getAttribute(name))).toEqual([
      'button',
      '0',
      'Search',
    ])
  })
})
