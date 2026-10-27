import { type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'

const LICENCE_MENU = 'header .v-btn:has(.mdi-chevron-down)'

export async function changeLicence(page: Page, licenceId: string): Promise<void> {
  // The admin is still booting when `goto` resolves. The header button is in the DOM,
  // but the bar is still laying out, so an immediate click waits out its timeout.
  // The list request the page fires on load signals that the boot is done.
  const listed = page
    .waitForResponse((response) => response.url().startsWith(`${CORE_DAM_API}/asset/licence/search`), {
      timeout: 30000,
    })
    .catch(() => null)
  await page.goto('/assets')
  await listed
  await page.locator(LICENCE_MENU).first().click()
  await page.locator('[data-cy="button-switch-licence"]').click()
  const dialog = page.getByRole('dialog').filter({ hasText: 'Prepnutie externého systému a licencie' })
  await dialog.locator('[data-cy="field-change-on-id-licence"] input').fill(licenceId)

  // "Potvrdiť a znovu načítať ADAM" reloads the whole admin. Wait for that reload before waiting
  // for the asset list, or a search response from the page being torn down would satisfy the wait.
  const reloaded = page.waitForEvent('framenavigated', { predicate: (frame) => frame === page.mainFrame() })
  await dialog.locator('[data-cy="button-confirm"]').click()
  await reloaded
  await page.waitForResponse(
    (response) =>
      response.url().startsWith(`${CORE_DAM_API}/asset/licence/search`) &&
      new URL(response.url()).searchParams.get('licences') === licenceId,
    { timeout: 30000 }
  )
  // Switching the licence can also switch the ext system. The upload dropzone is rebuilt only
  // after its asset custom forms are fetched, and uploading before that silently does nothing.
  await expect(page.locator('.v-progress-linear--active')).toHaveCount(0, { timeout: 30000 })
}
