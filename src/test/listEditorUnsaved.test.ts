import { describe, expect, it } from 'vitest'
import { createApp, h, nextTick, ref, type Ref } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import { AnzuSystemsCommonAdmin, type PluginOptions } from '@anzusystems/common-admin'
import { ASortableListEditor } from '@anzusystems/common-admin/labs'

// The unsaved ("amber") lifecycle every list editor in this admin depends on:
// nothing marked on arrival, marked the moment something changes, cleared once the save is
// confirmed. It belongs here rather than only upstream because the part that goes wrong is the
// part each consumer wires itself -- when the editor is created relative to its data, and whether
// anything tells it the data was saved.
//
// The controller takes its clean baseline ONCE, when it is created. Every row it has not seen by
// then reads as an unsaved addition, which is why each list editor in this repo sits behind a
// `v-if` on its loaded model. The last test pins that, so the guards are never quietly dropped.

interface Row {
  id: number
  title: string
}

interface Handle {
  hasUnsaved: boolean
  unsavedCount: number
  commit: (saved?: Row[]) => void
  updateItem: (key: number, next: Partial<Row>) => void
  moveItem: (from: number, to: number) => void
}

const mountEditor = (initial: Row[]) => {
  const model = ref(initial) as Ref<Row[]>
  const handle = ref<Handle>()
  const el = document.createElement('div')
  const app = createApp({
    setup: () => () =>
      h(ASortableListEditor as never, {
        ref: handle,
        modelValue: model.value,
        'onUpdate:modelValue': (next: Row[]) => (model.value = next),
        position: false,
        compactField: 'title',
      }),
  })
  app.use(createVuetify())
  // No messages: every admin augments vue-i18n's schema with its own locale tree, and satisfying
  // that here would mean shipping a copy of it. The editor only renders label text.
  app.use(createI18n({ legacy: false, locale: 'sk', missingWarn: false, fallbackWarn: false }))
  app.use<PluginOptions>(AnzuSystemsCommonAdmin, {
    languages: { available: ['sk'], default: 'sk' },
  } as unknown as PluginOptions)
  app.mount(el)

  return { model, app, editor: () => handle.value as Handle }
}

const rows = (): Row[] => [
  { id: 1, title: 'prvý' },
  { id: 2, title: 'druhý' },
]

describe('the unsaved lifecycle a list editor gives its consumer', () => {
  it('marks nothing when the data was there at mount', async () => {
    const { editor, app } = mountEditor(rows())
    await nextTick()

    expect(editor().hasUnsaved).toBe(false)
    expect(editor().unsavedCount).toBe(0)
    app.unmount()
  })

  it('marks a row the moment its content changes, and clears it on commit', async () => {
    const { editor, app } = mountEditor(rows())
    await nextTick()

    editor().updateItem(2, { title: 'zmenený' })
    await nextTick()
    expect(editor().hasUnsaved).toBe(true)
    expect(editor().unsavedCount).toBe(1)

    editor().commit()
    await nextTick()
    expect(editor().hasUnsaved).toBe(false)
    app.unmount()
  })

  it('marks a reorder too, which no row content would show', async () => {
    const { editor, app } = mountEditor(rows())
    await nextTick()

    editor().moveItem(0, 1)
    await nextTick()
    expect(editor().hasUnsaved).toBe(true)

    editor().commit()
    await nextTick()
    expect(editor().hasUnsaved).toBe(false)
    app.unmount()
  })

  it('reads rows that arrive after mount as unsaved additions', async () => {
    // Not a defect to fix here but the reason for every `v-if="…length > 0"` / `v-if="!loading"`
    // in front of a list editor in this repo: mount it while the fetch is still out and the whole
    // list lands amber before the user has touched anything.
    const { model, editor, app } = mountEditor([])
    await nextTick()
    expect(editor().hasUnsaved).toBe(false)

    model.value = rows()
    await nextTick()
    expect(editor().hasUnsaved).toBe(true)
    app.unmount()
  })
})
