import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Italic from '@tiptap/extension-italic'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Underline from '@tiptap/extension-underline'
import { Editor } from '@tiptap/vue-3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

import { useAnzutapToolbar } from '@/domains/coreDam/shared/components/anzutap/components/anzutapToolbar'
import type { ToolbarItemButton } from '@/domains/coreDam/shared/components/anzutap/components/anzutapToolbar'
import AnzutapToolbar from '@/domains/coreDam/shared/components/anzutap/components/AnzutapToolbar.vue'
import Link from '@/domains/coreDam/shared/components/anzutap/marks/link/link'
import en from '@/locales/en'
import sk from '@/locales/sk'
import { i18n } from '@/plugins/i18n'

/*
 * Editor toolbar buttons must show tooltips in the user's language.
 * Their tooltips come from the toolbar list, not a template.
 * `iconButtonTooltips.test.ts` checks that a tooltip exists but not its text.
 * Uses the real toolbar, an editor built like the podcast export data dialog builds it, and the app messages.
 */

i18n.global.setLocaleMessage('sk', sk)
i18n.global.setLocaleMessage('en', en as never)

const SAID = {
  sk: ['Tučné', 'Kurzíva', 'Podčiarknuté', 'Odkaz', 'Odstrániť odkaz'],
  en: ['Bold', 'Italic', 'Underline', 'Link', 'Remove link'],
} as const

let app: App | undefined
let editor: Editor | undefined

/** Editor of `PodcastExportDataBodyEditor.vue` with the cursor in a link. The link removal is offered only then. */
const editorInLink = () => {
  editor = new Editor({
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'linked', marks: [{ type: 'link', attrs: { href: 'https://dam.test' } }] }],
        },
      ],
    },
    editable: true,
    extensions: [Document, Paragraph, Text, Bold, Italic, Underline, Link.configure({ openOnClick: false })],
  })
  editor.commands.setTextSelection(3)

  return editor
}

const mountToolbar = async (locale: 'sk' | 'en') => {
  i18n.global.locale.value = locale
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AnzutapToolbar, { editor: editorInLink(), editable: true })
  app.use(createVuetify({ components }))
  app.use(i18n)
  app.mount(root)
  // The toolbar draws its buttons after mount, and each tooltip attaches to its button one tick later.
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()

  return () => Array.from(root.querySelectorAll('.anzutap-toolbar__item--button'))
}

const tooltips = async (locale: 'sk' | 'en') => {
  const buttons = await mountToolbar(locale)
  const said: string[] = []
  for (const button of buttons()) {
    button.dispatchEvent(new MouseEvent('mouseenter'))
    await vi.advanceTimersByTimeAsync(1000)
    const open = Array.from(document.body.querySelectorAll('.v-tooltip.v-overlay--active .v-overlay__content'))
    said.push(open.map((tooltip) => tooltip.textContent?.trim()).join(' + '))
    button.dispatchEvent(new MouseEvent('mouseleave'))
    await vi.advanceTimersByTimeAsync(1000)
  }

  return said
}

beforeEach(() => {
  vi.useFakeTimers()
  // happy-dom has no `visualViewport`, and an open tooltip listens on it for window resize.
  vi.stubGlobal('visualViewport', new EventTarget())
})

afterEach(() => {
  app?.unmount()
  app = undefined
  editor?.destroy()
  editor = undefined
  document.body.innerHTML = ''
  i18n.global.locale.value = 'sk'
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the buttons of the editor toolbar', () => {
  const buttons = () =>
    useAnzutapToolbar(editorInLink()).itemsRow1.filter((item): item is ToolbarItemButton => item.type === 'button')

  it('are the five the editor has, all of them shown while the cursor is in a link', () => {
    expect(buttons().map((button) => [button.id, button.show()])).toEqual([
      ['textBold', true],
      ['textItalic', true],
      ['textUnderline', true],
      ['openLink', true],
      ['removeLink', true],
    ])
  })

  // A title that is not a key of the app would be shown as written in every language.
  it.each(['sk', 'en'] as const)('are titled by keys the app has texts for in %s', (locale) => {
    const text = (key: string) => (i18n.global.te(key, locale) ? i18n.global.t(key, {}, { locale }) : undefined)

    expect(buttons().map((button) => text(button.titleT))).toEqual(SAID[locale])
  })

  it.each(['sk', 'en'] as const)('say in their tooltips the texts of the app in %s, not their keys', async (locale) => {
    expect(await tooltips(locale)).toEqual(SAID[locale])
  })

  // A tooltip is not an accessible name. The link opens a dialog
  // and the removal acts once, so they are not toggle marks.
  it('are named as their tooltips say, and the marks say whether they are on', async () => {
    const buttons = await mountToolbar('en')
    const named = () =>
      buttons().map((button) => [button.getAttribute('aria-label'), button.getAttribute('aria-pressed')])

    expect(named()).toEqual([
      ['Bold', 'false'],
      ['Italic', 'false'],
      ['Underline', 'false'],
      ['Link', null],
      ['Remove link', null],
    ])
    editor!.chain().setTextSelection({ from: 1, to: 7 }).toggleBold().run()
    // The editor reports its new state to the toolbar two frames later.
    await vi.advanceTimersByTimeAsync(100)
    await nextTick()
    expect(named().map(([, pressed]) => pressed)).toEqual(['true', 'false', 'false', null, null])
  })
})
