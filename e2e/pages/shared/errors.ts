import { type Page, type Request, type Route, expect } from '@playwright/test'
import { ALERT_SYSTEM_ERROR } from '@pages/shared/constants'
import { closeAlerts } from '@pages/shared/admin'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Run `action` and assert it sent no write request to the admin API.
 *
 * This is what makes a validation test mean something: a form that refuses to submit must refuse
 * *before* the API, not send the record and then complain. Every write in this app goes to
 * `/api/adm/`, so watching that prefix catches them all.
 *
 * `action` is expected to end on an assertion that the rejection is on screen — by then a request the
 * click did fire has long been issued, so nothing is missed by stopping the watch when it returns.
 */
export async function expectNoWrite(page: Page, action: () => Promise<void>): Promise<void> {
  const writes: string[] = []
  const watch = (request: Request) => {
    if (WRITE_METHODS.has(request.method()) && request.url().includes('/api/adm/')) {
      writes.push(`${request.method()} ${request.url()}`)
    }
  }
  page.on('request', watch)
  try {
    await action()
  } finally {
    page.off('request', watch)
  }
  expect(writes, 'an invalid form wrote to the API').toEqual([])
}

/** A route installed by `stubResponse`, counting what it caught and able to take itself back off. */
export interface Stub {
  /** How many requests the stub has answered so far. */
  hits(): number
  /** Remove the route, so the app talks to the real API again. */
  stop(): Promise<void>
}

/**
 * Answer every request matching `urlGlob` locally instead of letting it reach the API.
 *
 * No environment can be made to fail on demand: nothing in the admin turns a healthy endpoint into a
 * 500, and an upload cannot be made to trip the server's own validation without a file the fixtures
 * deliberately do not carry. A stub is the only way to assert what the app does with an answer it
 * cannot produce, and it only ever stands in for the failure, never for a success the test then
 * claims as real.
 */
export async function stubResponse(
  page: Page,
  urlGlob: string,
  response: { status: number; contentType?: string; body?: string }
): Promise<Stub> {
  let hits = 0
  await page.route(urlGlob, async (route: Route) => {
    hits++
    await route.fulfill({
      status: response.status,
      contentType: response.contentType ?? 'application/json',
      body: response.body ?? '{}',
    })
  })
  return {
    hits: () => hits,
    stop: async () => {
      await page.unroute(urlGlob)
    },
  }
}

/**
 * The body the API sends when it rejects a request on validation grounds — `fields` maps each rejected
 * field to its reasons. The upload service switches on those keys to pick the message it shows
 * (`system.uploadErrors.*`), so the key is what a stub has to get right; the values are only used for
 * keys the app has no message for.
 */
export function validationErrorBody(fields: Record<string, string[]>): string {
  return JSON.stringify({ contextId: 'e2e-stub', error: 'validation_failed', fields })
}

/** Assert the system-error alert is up, then clear it so it cannot swallow the next click. */
export async function expectSystemError(page: Page): Promise<void> {
  await expect(page.locator('.v-alert').filter({ hasText: ALERT_SYSTEM_ERROR }).first()).toBeVisible({
    timeout: 30000,
  })
  await closeAlerts(page)
}
