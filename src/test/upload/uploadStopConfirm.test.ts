import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import type { App } from 'vue'
import { createI18n } from 'vue-i18n'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

/* The button that stops the uploads of a queue. While something is uploading it asks first, and the question can
 * be dismissed from the keyboard: the app's dialogs are persistent, so Esc closes one only where the dialog says
 * so itself. */

vi.mock('@anzusystems/common-admin', async (importOriginal) => {
  const { h } = await import('vue')

  return {
    ...((await importOriginal()) as Record<string, unknown>),
    ADialogToolbar: { render: () => h('div') },
  }
})

const AssetFooterUploadButtonStop = (
  await import('@/domains/coreDam/asset/components/footer/AssetFooterUploadButtonStop.vue')
).default

const STOP = 'system.upload.stop'

let app: App | undefined

const mountButton = async (isUploading: boolean) => {
  const confirmed = vi.fn()
  const root = document.createElement('div')
  document.body.appendChild(root)
  app = createApp(AssetFooterUploadButtonStop, { isUploading, onConfirm: confirmed })
  app.use(
    createVuetify({
      components,
      aliases: { ABtnPrimary: components.VBtn, ABtnTertiary: components.VBtn },
      // As the app has them: Esc and a click outside leave a dialog open.
      defaults: { VDialog: { persistent: true, noClickAnimation: true } },
    })
  )
  app.use(createI18n({ legacy: false, locale: 'en', missingWarn: false, fallbackWarn: false }))
  app.mount(root)
  await nextTick()
  const button = root.querySelector<HTMLButtonElement>('[data-cy="button-stop"]')!
  const question = () => document.body.querySelector<HTMLElement>('[data-cy="delete-panel"]')
  const press = async (key: string) => {
    question()?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    await nextTick()
  }

  return { button, confirmed, question, press }
}

beforeEach(() => {
  // happy-dom has none, and the dialog listens on it for the size of the window.
  vi.stubGlobal('visualViewport', new EventTarget())
})

afterEach(() => {
  app?.unmount()
  app = undefined
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('the button that stops the uploads', () => {
  it('has an accessible name, the text of its tooltip', async () => {
    const { button } = await mountButton(true)

    expect(button.getAttribute('aria-label')).toBe(STOP)
  })

  it('stops at once when nothing is uploading', async () => {
    const { button, confirmed, question } = await mountButton(false)

    button.click()
    await nextTick()

    expect(confirmed).toHaveBeenCalledTimes(1)
    expect(question()).toBeNull()
  })

  it('asks first while something is uploading, and stops when the question is confirmed', async () => {
    const { button, confirmed, question } = await mountButton(true)

    button.click()
    await nextTick()
    expect(question()).not.toBeNull()
    expect(confirmed).not.toHaveBeenCalled()

    document.body.querySelector<HTMLButtonElement>('[data-cy="button-confirm"]')?.click()
    await nextTick()

    expect(confirmed).toHaveBeenCalledTimes(1)
    expect(question()).toBeNull()
  })

  it('takes Esc in the question as "cancel": the question goes away and nothing is stopped', async () => {
    const { button, confirmed, question, press } = await mountButton(true)
    button.click()
    await nextTick()

    await press('Enter')
    expect(question()).not.toBeNull()

    await press('Escape')

    expect(question()).toBeNull()
    expect(confirmed).not.toHaveBeenCalled()
  })
})
