import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, RAND_NUM } from '@pages/shared/constants'
import { detailRow, rowWithCell } from '@pages/shared/crud'
import { columnValues, tableHeaders, tableRows } from '@pages/shared/datatable'
import { expectNoWrite } from '@pages/shared/errors'
import {
  COLUMN,
  createLicenceGroup,
  deleteLicenceGroupStatus,
  deleteLicenceGroupsViaApi,
  fetchLicenceGroup,
  fillLicenceGroupForm,
  licenceGroupTable,
  openCreateDialog,
  openLicenceGroupDetail,
  openLicenceGroups,
  updateLicenceGroup,
} from '@pages/settings/assetLicenceGroupPage'

/**
 * Asset licence groups — a named bundle of asset licences belonging to one ext system.
 *
 * **This spec leaves its fixture behind, on purpose.** A group cannot be deleted (DAM-B3: the API
 * answers a delete with a 500), so `afterAll` sweeps every group named with the `E2E` prefix
 * best-effort and the sweep starts working — clearing the leftovers of earlier runs with it — the day
 * the bug is fixed.
 *
 * Known bugs: DAM-B3.
 */

let page: Page
let GROUP_ID = ''

const NAME_PREFIX = 'E2E licence group'
const NAME = `${NAME_PREFIX} ${RAND_NUM}`
/** Ext system of the licence every test runs under. The select offers ext systems by **slug**… */
const EXT_SYSTEM = 'cms'
/** …while the list and the detail render the same ext system by its display name. */
const EXT_SYSTEM_NAME = 'CMS system'
const LICENCE = 'Sme Family'
/** A group every environment carries, used to assert the list renders what it holds. */
const LIVE_GROUP = 'Sme family'
const SECOND_LICENCE = 'Spectator'

test.describe.serial(`${ADMIN_SUITE} - Asset licence group`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
    await openLicenceGroups(page)
  })

  test.afterAll(async () => {
    await deleteLicenceGroupsViaApi(page, NAME_PREFIX)
    await page.context().close()
  })

  test('lists the groups with their ext system and licences', async () => {
    expect(await tableHeaders(page)).toEqual(['Názov', 'Externý systém', 'Licencie', 'Vytvorené', 'Upravené', ''])

    expect(await tableRows(page).count(), 'this environment holds licence groups').toBeGreaterThan(0)

    // Asserted on a group that is part of the environment rather than on whichever row sorts first: a
    // group may legitimately hold no licences, and the newest row is whatever the last run created.
    const row = rowWithCell(page, LIVE_GROUP)
    await expect(row, `the environment holds the "${LIVE_GROUP}" group`).toHaveCount(1)
    // Its ext system and licences are chips fetched *after* the group itself, each one a spinner until
    // its own request lands — so the resolved chip is what's asserted, not just non-empty cell text
    // (which is also true of the spinner).
    const cell = (column: number) => row.locator(`td:nth-child(${column + 1})`)
    await expect(cell(COLUMN.extSystem).locator('.v-chip').first()).toBeVisible()
    await expect(cell(COLUMN.licences).locator('.v-chip').first()).toBeVisible()
  })

  test('creates a licence group', async () => {
    GROUP_ID = await createLicenceGroup(page, { name: NAME, extSystem: EXT_SYSTEM, licence: LICENCE })

    await openLicenceGroupDetail(page, GROUP_ID)
    await expect(detailRow(page, 'Názov')).toContainText(NAME)
    await expect(detailRow(page, 'Externý systém')).toContainText(EXT_SYSTEM_NAME)
    await expect(detailRow(page, 'Licencie')).toContainText(LICENCE)
  })

  test('finds the new group through the id filter', async () => {
    await openLicenceGroups(page)
    const table = licenceGroupTable(page)
    await table.fillFilter(/^\s*ID\s*$/i, GROUP_ID)
    await table.submitFilter()

    expect(await columnValues(page, COLUMN.name)).toEqual([NAME])
    await table.resetFilter()
  })

  test('renames the group and adds a licence to it', async () => {
    const before = await fetchLicenceGroup(page, GROUP_ID)
    await updateLicenceGroup(page, GROUP_ID, { name: `${NAME}-edit`, licence: SECOND_LICENCE })

    const after = await fetchLicenceGroup(page, GROUP_ID)
    expect(after.name).toBe(`${NAME}-edit`)
    expect(after.licences.length, 'the second licence was added, not swapped in').toBe(before.licences.length + 1)

    await openLicenceGroupDetail(page, GROUP_ID)
    await expect(detailRow(page, 'Licencie')).toContainText(LICENCE)
    await expect(detailRow(page, 'Licencie')).toContainText(SECOND_LICENCE)
  })

  test('refuses to create a group with no name and no ext system', async () => {
    await openLicenceGroups(page)
    const panel = await openCreateDialog(page)
    await fillLicenceGroupForm(page, panel, { licence: LICENCE })

    // A form that fails validation must not reach the API at all.
    await expectNoWrite(page, async () => {
      await panel.locator('[data-cy="button-confirm"]').click()
      await expect(page.locator('.v-alert').filter({ hasText: 'Vyplňte všetky povinné polia' })).toBeVisible()
      await expect(panel.getByText('Povinná hodnota.')).toHaveCount(2)
    })

    await panel.locator('[data-cy="button-cancel"]').click()
    await expect(panel).toBeHidden()
  })

  test('deletes a licence group again @bug', async () => {
    test.fail() // DAM-B3: the API answers the delete with a 500 — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B3' })

    const status = await deleteLicenceGroupStatus(page, GROUP_ID)
    // Either the group goes, or the API says plainly that it cannot be deleted. Never a server error.
    expect([204, 404, 405], `DELETE /asset-licence-group/${GROUP_ID} responded ${status}`).toContain(status)
  })
})
