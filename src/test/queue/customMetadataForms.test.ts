import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { Component, Ref } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { buttonsNamed, customField, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'
import type { UploadUiSetup } from '@/test/support/uploadUi'

/* The two forms that draw the custom fields DAM is configured with: the one of an asset - in a row of the queue, in
 * the detail and in the sidebar of the list - and the scratch form of the mass operations. Which fields each shows,
 * what "show more details" does, and what they give back when typed into. The real forms over the config store of
 * the library, each under a parent that holds its value as a row of the queue does.
 *
 * What they validate, and for whom, is in `asset/assetMetadataValidation.test.ts` and `queueRowValidation.test.ts`. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SHOW = 'Show more details'
const HIDE = 'Hide more details'

const three = [customField('title'), customField('description'), customField('note')]

const fields = (within: ParentNode) =>
  Array.from(within.querySelectorAll<HTMLElement>('.v-input')).map((input) => ({
    label: input.querySelector('label')?.textContent?.trim(),
    shown: !input.closest<HTMLElement>('[style*="display: none"]'),
    textarea: input.querySelector<HTMLTextAreaElement>('textarea')!,
  }))
const shown = (within: ParentNode) =>
  fields(within)
    .filter((field) => field.shown)
    .map((field) => field.label)
const all = (within: ParentNode) => fields(within).map((field) => field.label)

const typeInto = async (within: ParentNode, label: string, value: string) => {
  const field = fields(within).find((one) => one.label === label)!
  field.textarea.value = value
  field.textarea.dispatchEvent(new Event('input'))
  await nextTick()
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the custom metadata form of an asset', () => {
  interface Mounted {
    assetType?: DamAssetTypeType
    value?: Record<string, unknown>
    /** How many forms the page holds: each with a value of its own. */
    forms?: number
  }

  /** Mounts the form under a parent that keeps its value, and can ask everything below it to validate. */
  const mountForm = async (setup: Partial<UploadUiSetup>, mounted: Mounted = {}) => {
    const ui = await startUploadUi({ server, ...setup })
    const assetType: Ref<DamAssetTypeType> = ref(mounted.assetType ?? 'image')
    const values = Array.from({ length: mounted.forms ?? 1 }, () => ref({ ...mounted.value }))
    const changes = vi.fn()
    let validateAll: () => void = () => undefined
    const page = await ui.mount(async () => {
      const Form = (await import('@/domains/coreDam/shared/components/customMetadata/AssetCustomMetadataForm.vue'))
        .default as Component

      return {
        default: defineComponent({
          setup() {
            const v$ = useVuelidate()
            validateAll = () => v$.value.$touch()

            return () =>
              values.map((value, index) =>
                h('section', { key: index }, [
                  h(
                    Form,
                    {
                      modelValue: value.value,
                      'onUpdate:modelValue': (updated: Record<string, unknown>) => (value.value = updated),
                      assetType: assetType.value,
                      onAnyChange: changes,
                    },
                    {
                      'before-pinned': () => h('p', 'BEFORE'),
                      'after-pinned': () => h('p', 'AFTER'),
                    }
                  ),
                ])
              )
          },
        }),
      }
    })
    const form = (index = 0) => page.querySelectorAll<HTMLElement>('section')[index]

    return { ...ui, page, form, values, assetType, changes, validateAll: () => validateAll() }
  }

  describe('what it shows', () => {
    it('is as many fields of the asset type as the ext system pins, and the rest behind a button', async () => {
      const { form } = await mountForm({
        customForm: { image: three },
        extSystem: { image: { customMetadataPinnedAmount: 1 } },
      })

      expect(shown(form())).toEqual(['title'])
      expect(all(form())).toEqual(['title', 'description', 'note'])
      expect(buttonsNamed(form(), SHOW)).toHaveLength(1)
    })

    it.each([3, 10])('is every field, and no button, where the ext system pins %s of three', async (pinned) => {
      const { form } = await mountForm({
        customForm: { image: three },
        extSystem: { image: { customMetadataPinnedAmount: pinned } },
      })

      expect(shown(form())).toEqual(['title', 'description', 'note'])
      expect(form().querySelectorAll('button')).toHaveLength(0)
    })

    it('is no field at all, only the button, where the ext system says nothing of pinning', async () => {
      const { form } = await mountForm({
        customForm: { image: three },
        extSystem: { image: { customMetadataPinnedAmount: undefined } },
      })

      expect(shown(form())).toEqual([])
      expect(all(form())).toEqual(['title', 'description', 'note'])
      expect(buttonsNamed(form(), SHOW)).toHaveLength(1)
    })

    it('is the fields of its own asset type, pinned as that type is, and follows the type it is given', async () => {
      const { form, assetType } = await mountForm(
        {
          customForm: { image: three, audio: [customField('album'), customField('track')] },
          extSystem: { image: { customMetadataPinnedAmount: 2 }, audio: { customMetadataPinnedAmount: 1 } },
        },
        { assetType: 'audio' }
      )
      expect([shown(form()), all(form())]).toEqual([['album'], ['album', 'track']])

      assetType.value = 'image'
      await nextTick()

      expect([shown(form()), all(form())]).toEqual([
        ['title', 'description'],
        ['title', 'description', 'note'],
      ])
    })

    it('puts what its parent adds before the pinned fields, and after them: ahead of the fields behind the button', async () => {
      const { form } = await mountForm({
        customForm: { image: three },
        extSystem: { image: { customMetadataPinnedAmount: 2 } },
      })

      const order = Array.from(form().querySelectorAll('p, .v-input label.v-field-label--floating')).map((element) =>
        element.textContent?.trim()
      )
      expect(order).toEqual(['BEFORE', 'title', 'description', 'AFTER', 'note'])
    })
  })

  describe('its "show more details" button', () => {
    const oneOfThree = { customForm: { image: three }, extSystem: { image: { customMetadataPinnedAmount: 1 } } }

    it('shows the rest of the fields and offers to hide them again', async () => {
      const { form } = await mountForm(oneOfThree)

      buttonsNamed(form(), SHOW)[0].click()
      await nextTick()

      expect(shown(form())).toEqual(['title', 'description', 'note'])
      expect([buttonsNamed(form(), SHOW).length, buttonsNamed(form(), HIDE).length]).toEqual([0, 1])

      buttonsNamed(form(), HIDE)[0].click()
      await nextTick()

      expect(shown(form())).toEqual(['title'])
      expect([buttonsNamed(form(), SHOW).length, buttonsNamed(form(), HIDE).length]).toEqual([1, 0])
    })

    // Every row of the queue has a form: one press opens them all.
    it('is one choice for every form on the page', async () => {
      const { form } = await mountForm(oneOfThree, { forms: 2 })

      buttonsNamed(form(0), SHOW)[0].click()
      await nextTick()

      expect([shown(form(0)), shown(form(1))]).toEqual([
        ['title', 'description', 'note'],
        ['title', 'description', 'note'],
      ])

      buttonsNamed(form(1), HIDE)[0].click()
      await nextTick()

      expect([shown(form(0)), shown(form(1))]).toEqual([['title'], ['title']])
    })

    it('is of no use while a field behind it fails: the form of that field stays open, with "hide" disabled', async () => {
      const { form, validateAll } = await mountForm(
        {
          customForm: { image: [customField('title'), customField('note', { required: true })] },
          extSystem: { image: { customMetadataPinnedAmount: 1 } },
        },
        { forms: 2 }
      )
      // Only the second form is put right.
      await typeInto(form(1), 'note', 'filled')

      validateAll()
      await nextTick()
      await nextTick()

      expect([shown(form(0)), shown(form(1))]).toEqual([['title', 'note'], ['title']])
      expect(buttonsNamed(form(0), HIDE)[0]?.disabled).toBe(true)
      expect(buttonsNamed(form(1), SHOW)[0]?.disabled).toBe(false)
    })
  })

  describe('what it gives back', () => {
    it('is the whole custom data with the typed field changed, and a word that something changed', async () => {
      const { form, values, changes } = await mountForm(
        { customForm: { image: three }, extSystem: { image: { customMetadataPinnedAmount: 3 } } },
        { value: { title: 'old', description: 'kept', unknown: 7 } }
      )

      await typeInto(form(), 'title', 'new')

      // Also a value no field of the form shows.
      expect(values[0].value).toEqual({ title: 'new', description: 'kept', unknown: 7 })
      expect(changes).toHaveBeenCalledTimes(1)
      expect(fields(form()).map((field) => field.textarea.value)).toEqual(['new', 'kept', ''])
    })
  })
})

describe('the custom metadata form of the mass operations', () => {
  const mountScratch = async (setup: Partial<UploadUiSetup>, assetType: DamAssetTypeType = 'image') => {
    const ui = await startUploadUi({ server, ...setup })
    const value = ref<Record<string, unknown>>({})
    const asked: Array<[string, unknown]> = []
    const form = await ui.mount(async () => {
      const Form = (
        await import('@/domains/coreDam/shared/components/customMetadata/AssetCustomMetadataFormMassOperations.vue')
      ).default as Component

      return {
        default: defineComponent({
          setup: () => () =>
            h(Form, {
              modelValue: value.value,
              'onUpdate:modelValue': (updated: Record<string, unknown>) => (value.value = updated),
              assetType,
              onFillEmptyField: (data: unknown) => asked.push(['fill', data]),
              onReplaceField: (data: unknown) => asked.push(['replace', data]),
            }),
        }),
      }
    })

    return { ...ui, form, value, asked }
  }

  it('shows every field of the asset type at once, whatever the ext system pins, with no button to show more', async () => {
    const { form } = await mountScratch({
      customForm: { image: three, audio: [customField('album')] },
      extSystem: { image: { customMetadataPinnedAmount: 1 } },
    })

    expect(shown(form)).toEqual(['title', 'description', 'note'])
    expect(buttonsNamed(form, SHOW)).toEqual([])
  })

  it('has no input and no buttons for a field that cannot be written', async () => {
    const { form } = await mountScratch({
      customForm: { image: [customField('title'), customField('locked', { readonly: true })] },
    })

    expect(all(form)).toEqual(['title'])
    expect(form.querySelectorAll('button')).toHaveLength(2)
  })

  it('keeps what is typed into its fields, one beside the other', async () => {
    const { form, value } = await mountScratch({ customForm: { image: three } })

    await typeInto(form, 'title', 'a title')
    await typeInto(form, 'note', 'a note')

    expect(value.value).toEqual({ title: 'a title', note: 'a note' })
  })

  it('asks, by the buttons of a field, for the value of that field to be filled in or written over', async () => {
    const { form, asked } = await mountScratch(
      { customForm: { audio: [customField('album'), customField('track')] } },
      'audio'
    )
    await typeInto(form, 'track', 'the second')

    buttonsNamed(form, 'Fill empty')[1].click()
    buttonsNamed(form, 'Replace in all assets')[1].click()
    // And for a field nothing was typed into: with no value.
    buttonsNamed(form, 'Fill empty')[0].click()

    expect(asked).toEqual([
      ['fill', { assetType: 'audio', elementProperty: 'track', value: 'the second' }],
      ['replace', { assetType: 'audio', elementProperty: 'track', value: 'the second' }],
      ['fill', { assetType: 'audio', elementProperty: 'album', value: undefined }],
    ])
  })
})
