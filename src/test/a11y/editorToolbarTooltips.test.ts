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

/* The buttons of the editor toolbar say what they do in the language of the user. Their tooltips come from the
 * list of the toolbar, not from a template, so `iconButtonTooltips.test.ts` sees that each button has a tooltip
 * but not what it says. The real toolbar over an editor built as the dialog of podcast export data builds it, and
 * over the messages of the application. */

// The app's own messages, the library's `common.*` among them.
i18n.global.setLocaleMessage('sk', sk)
i18n.global.setLocaleMessage('en', en as never)

const SAID = {
  sk: ['Tučné', 'Kurzíva', 'Podčiarknuté', 'Odkaz', 'Odstrániť odkaz'],
  en: ['Bold', 'Italic', 'Underline', 'Link', 'Remove link'],
} as const

let app: App | undefined
let editor: Editor | undefined

/** The editor of `PodcastExportDataBodyEditor.vue`, its cursor in a link: only then is the link offered for removal. */
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

/** The toolbar over the editor, in the language; answers its buttons, in the order of the toolbar. */
const mountToolbar = async (locale: 'sk' | 'en') => {
  i18n.global.locale.value = locale
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AnzutapToolbar, { editor: editorInLink(), editable: true })
  app.use(createVuetify({ components }))
  app.use(i18n)
  app.mount(root)
  // The toolbar draws its buttons once it is mounted, and each tooltip takes its button a tick after that.
  await vi.advanceTimersByTimeAsync(0)
  await nextTick()

  return () => Array.from(root.querySelectorAll('.anzutap-toolbar__item--button'))
}

/** What the buttons of the toolbar say of themselves when the pointer is over them, in the order of the toolbar. */
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
  // happy-dom has none, and an open tooltip listens on it for the size of the window.
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

  // A title that is not a key of the app would show as it is written, in every language.
  it.each(['sk', 'en'] as const)('are titled by keys the app has texts for in %s', (locale) => {
    const text = (key: string) => (i18n.global.te(key, locale) ? i18n.global.t(key, {}, { locale }) : undefined)

    expect(buttons().map((button) => text(button.titleT))).toEqual(SAID[locale])
  })

  it.each(['sk', 'en'] as const)('say in their tooltips the texts of the app in %s, not their keys', async (locale) => {
    expect(await tooltips(locale)).toEqual(SAID[locale])
  })

  // A tooltip is not a name. The link opens a dialog and the removal of it acts once: they are no marks to switch.
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
    // The editor tells the toolbar of its new state two frames later.
    await vi.advanceTimersByTimeAsync(100)
    await nextTick()
    expect(named().map(([, pressed]) => pressed)).toEqual(['true', 'false', 'false', null, null])
  })
})
