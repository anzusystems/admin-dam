import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { dialogButton, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * Tests the question the stop button asks while something is uploading: its text and the ways to answer "no".
 * Stopping at once when nothing is uploading, stopping on "yes"
 * and Esc as "no" are covered in `uploadStopConfirm.test.ts`.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const CLOSE = 'Close'
const STOP = 'Stop'
const QUESTION = 'Do you want to stop the upload?'

const mountButton = async (props: Record<string, unknown> = {}) => {
  const ui = await startUploadUi({ server })
  const isUploading = ref(true)
  const confirmed = vi.fn()
  const page = await ui.mount(async () => {
    const { ADamUploadQueueStopButton: Button } = await import('@anzusystems/common-admin')

    return {
      default: defineComponent({
        setup: () => () => h(Button, { isUploading: isUploading.value, onConfirm: confirmed, ...props }),
      }),
    }
  })
  const button = page.querySelector<HTMLButtonElement>('button')!
  const question = () => document.body.querySelector<HTMLElement>('.v-dialog .v-card')
  const press = async () => {
    button.click()
    await nextTick()
  }

  return { button, question, press, confirmed, isUploading }
}

beforeEach(() => {
  server = createFakeDam()
})

afterEach(() => {
  stopUploadUi()
})

describe('the question of the button that stops the uploads', () => {
  it('asks whether to stop the upload, and offers "cancel" and "stop"', async () => {
    const { button, question, press } = await mountButton()
    expect(button.getAttribute('aria-label')).toBe(CLOSE)

    await press()

    expect(question()?.textContent).toContain(QUESTION)
    const offered = Array.from(question()!.querySelectorAll('.v-card-actions button')).map((one) =>
      one.textContent?.trim()
    )
    expect(offered).toEqual(['Cancel', STOP])
  })

  it('goes away on "cancel" with nothing stopped, and is asked again at the next press', async () => {
    const { question, press, confirmed } = await mountButton()
    await press()

    dialogButton('Cancel')?.click()
    await eventually(() => expect(question()).toBeNull())
    expect(confirmed).not.toHaveBeenCalled()

    await press()

    expect(question()?.textContent).toContain(QUESTION)
    expect(confirmed).not.toHaveBeenCalled()
  })

  it('goes away on the cross of its toolbar with nothing stopped', async () => {
    const { question, press, confirmed } = await mountButton()
    await press()

    question()?.querySelector<HTMLButtonElement>('.v-toolbar button')?.click()
    await eventually(() => expect(question()).toBeNull())

    expect(confirmed).not.toHaveBeenCalled()
  })

  it('is asked or not by whether something is uploading at the moment of the press', async () => {
    const { question, press, confirmed, isUploading } = await mountButton()

    isUploading.value = false
    await nextTick()
    await press()

    expect(question()).toBeNull()
    expect(confirmed).toHaveBeenCalledTimes(1)

    isUploading.value = true
    await nextTick()
    await press()

    expect(question()).not.toBeNull()
    expect(confirmed).toHaveBeenCalledTimes(1)
  })

  it('stops on "yes" also when the last upload has ended meanwhile', async () => {
    const { question, press, confirmed, isUploading } = await mountButton()
    await press()

    isUploading.value = false
    await nextTick()
    expect(question()).not.toBeNull()

    dialogButton(STOP)?.click()
    await eventually(() => expect(question()).toBeNull())

    expect(confirmed).toHaveBeenCalledTimes(1)
  })

  // The end-to-end tests of the application find the button by `button-stop`.
  it('is found by `button-stop`, or by the name its panel gives it', async () => {
    const plain = await mountButton()
    expect(plain.button.getAttribute('data-cy')).toBe('button-stop')
    stopUploadUi()

    const named = await mountButton({ dataCy: 'button-close' })
    expect(named.button.getAttribute('data-cy')).toBe('button-close')
  })
})
