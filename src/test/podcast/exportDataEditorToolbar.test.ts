import type { JSONContent } from '@tiptap/core'
import type { Editor } from '@tiptap/vue-3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The toolbar of the editor of podcast export data: which buttons it offers as the cursor moves through the text.
 * The real editor of the dialog, which builds its own tiptap editor, with the application around it as it starts.
 * The cursor is put where a click would put it, by the command of the editor: the page here has no layout to click
 * into. What the buttons say when pointed at is in `a11y/editorToolbarTooltips.test.ts`. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

// The buttons by their icons, in the order of the toolbar.
const ALWAYS = ['mdi-format-bold', 'mdi-format-italic', 'mdi-format-underline', 'mdi-link']
const REMOVE_LINK = 'mdi-link-off'

const plain = (text: string): JSONContent => ({ type: 'text', text })
const linked = (text: string): JSONContent => ({
  type: 'text',
  text,
  marks: [{ type: 'link', attrs: { href: 'https://dam.test' } }],
})
const paragraphOf = (...content: JSONContent[]): JSONContent => ({
  type: 'doc',
  content: [{ type: 'paragraph', content }],
})

// "plain linked tail": the cursor stands before the first letter at 1, and each letter is one step.
const LINK_IN_THE_MIDDLE = paragraphOf(plain('plain '), linked('linked'), plain(' tail'))
const IN_PLAIN = 3
const IN_LINKED = 10
const IN_TAIL = 16
// "linked tail"
const LINK_AT_THE_START = paragraphOf(linked('linked'), plain(' tail'))
const AFTER_THE_LINK = 10

const openEditor = async (content: JSONContent) => {
  const ui = await startUploadUi({ server })
  const element = await ui.mount(() => import('@/domains/coreDam/podcast/components/PodcastExportDataBodyEditor.vue'), {
    editable: true,
    modelValue: content,
  })
  // The dialog draws its editor once tiptap says it is created, a moment after it was built.
  const text = await eventually(() => {
    const found = element.querySelector('.ProseMirror')
    expect(found).not.toBeNull()

    return found as unknown as { editor: Editor }
  })
  const editor = text.editor
  const buttons = () =>
    Array.from(element.querySelectorAll<HTMLElement>('.anzutap-toolbar__item--button')).map((button) =>
      Array.from(button.querySelector('.v-icon')?.classList ?? []).find((name) => name.startsWith('mdi-'))
    )

  return {
    editor,
    buttons,
    /** The cursor before the letter at that place. The editor tells of its new state two frames later. */
    cursorAt: async (position: number) => {
      editor.commands.setTextSelection(position)
      await vi.advanceTimersByTimeAsync(100)
    },
    press: async (icon: string) => {
      element.querySelectorAll<HTMLElement>('.anzutap-toolbar__item--button')[buttons().indexOf(icon)].click()
      await vi.advanceTimersByTimeAsync(100)
    },
    /** The texts of the paragraph, each with whether it is a link. */
    texts: () => {
      const paragraph: JSONContent | undefined = editor.getJSON().content?.[0]

      return (paragraph?.content ?? []).map((part) => [part.text, part.marks !== undefined])
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the toolbar of the editor of podcast export data', () => {
  it('offers bold, italic, underline and link, and no removal of a link, in a text without one', async () => {
    const { buttons, cursorAt } = await openEditor(paragraphOf(plain('plain text')))

    expect(buttons()).toEqual(ALWAYS)

    await cursorAt(IN_PLAIN)

    expect(buttons()).toEqual(ALWAYS)
  })

  it('offers the removal of a link while the cursor is in a link, and not while it is outside', async () => {
    const { buttons, cursorAt } = await openEditor(LINK_IN_THE_MIDDLE)
    expect(buttons()).toEqual(ALWAYS)

    await cursorAt(IN_LINKED)
    expect(buttons()).toEqual([...ALWAYS, REMOVE_LINK])

    await cursorAt(IN_TAIL)
    expect(buttons()).toEqual(ALWAYS)

    await cursorAt(IN_LINKED)
    expect(buttons()).toEqual([...ALWAYS, REMOVE_LINK])

    await cursorAt(IN_PLAIN)
    expect(buttons()).toEqual(ALWAYS)
  })

  // The editor opens with its cursor at the start: in the link, when the text starts with one.
  it('offers the removal at once in a text that starts with a link, and no longer once the cursor left the link', async () => {
    const { buttons, cursorAt } = await openEditor(LINK_AT_THE_START)
    expect(buttons()).toEqual([...ALWAYS, REMOVE_LINK])

    await cursorAt(AFTER_THE_LINK)

    expect(buttons()).toEqual(ALWAYS)
  })

  it('removes the link the cursor is in when the removal is pressed, and no longer offers it', async () => {
    const { buttons, cursorAt, press, texts } = await openEditor(LINK_IN_THE_MIDDLE)
    await cursorAt(IN_LINKED)
    expect(texts()).toEqual([
      ['plain ', false],
      ['linked', true],
      [' tail', false],
    ])

    await press(REMOVE_LINK)

    expect(texts()).toEqual([['plain linked tail', false]])
    expect(buttons()).toEqual(ALWAYS)
  })
})
