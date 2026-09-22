import { type Page, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'

/** The licence switcher button in the asset list header — it is labelled with the current licence name. */
const LICENCE_MENU = 'header .v-btn:has(.mdi-chevron-down)'

/**
 * Switch the current user to `licenceId` through the header licence dialog, which reloads the admin.
 * Lands on the asset list of that licence.
 */
export async function changeLicence(page: Page, licenceId: string): Promise<void> {
  // The admin is still booting when `goto` resolves. The header button is in the DOM by then, but the bar
  // is still laying out around it, so a click issued straight away waits out its own timeout on an element
  // that never settles. The list request the page fires on load is what says the boot is done.
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

  // "Potvrdiť a znovu načítať ADAM" reloads the whole admin: wait for that reload before waiting for the asset
  // list, or a search response from the page being torn down would do, and so would the next action.
  const reloaded = page.waitForEvent('framenavigated', { predicate: (frame) => frame === page.mainFrame() })
  await dialog.locator('[data-cy="button-confirm"]').click()
  await reloaded
  await page.waitForResponse(
    (response) =>
      response.url().startsWith(`${CORE_DAM_API}/asset/licence/search`) &&
      new URL(response.url()).searchParams.get('licences') === licenceId,
    { timeout: 30000 }
  )
  // Switching the licence can also switch the ext system, and the upload dropzone is only rebuilt once
  // its asset custom forms are fetched - uploading before that silently does nothing.
  await expect(page.locator('.v-progress-linear--active')).toHaveCount(0, { timeout: 30000 })
}
