import { type Page, type Request, type Route, expect } from '@playwright/test'
import { ALERT_SYSTEM_ERROR } from '@pages/shared/constants'
import { closeAlerts } from '@pages/shared/admin'

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * Run `action` and assert it sent no write request to the admin API.
 * A form that refuses to submit must refuse before the API, not send the record and then
 * complain. Every write goes to `/api/adm/`, so watching that prefix catches them all.
 * `action` must end on an assertion that the rejection is on
 * screen. By then any request the click fired has been issued.
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

export interface Stub {
  hits(): number
  stop(): Promise<void>
}

/**
 * Answer every request matching `urlGlob` locally instead of letting it reach the API.
 * No environment can fail on demand: a healthy endpoint cannot be turned into a 500, and an upload cannot trip server
 * validation without a file the fixtures do not carry. A stub only stands in for the failure, never for a success.
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
 * The body the API sends when it rejects a request on validation
 * grounds. `fields` maps each rejected field to its reasons.
 * The upload service switches on those keys to pick the message (`system.uploadErrors.*`),
 * so a stub must get the keys right. Values are only used for keys with no message.
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
