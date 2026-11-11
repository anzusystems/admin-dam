import { test, expect, type Page } from '@playwright/test'
import { prepareUser } from '@pages/shared/login'
import { ADMIN_SUITE, ALERT_DELETE, RAND_NUM } from '@pages/shared/constants'
import { detailRow } from '@pages/shared/crud'
import { columnValues, tableHeaders } from '@pages/shared/datatable'
import {
  COLUMN,
  MODE,
  TYPE,
  cleanPhraseStatus,
  cleanPhraseTable,
  createCleanPhrase,
  deleteCleanPhraseViaApi,
  deleteOpenCleanPhrase,
  filterCleanPhrasesBy,
  openCleanPhraseDetail,
  openCleanPhrases,
  runPlayground,
  updateCleanPhrase,
} from '@pages/settings/authorCleanPhrasePage'

/**
 * Author clean phrases — the rules that turn the free-text author line of an imported asset into DAM
 * authors.
 *
 * The rules are only worth anything if they fire, so this spec does not stop at storing one: after
 * creating a rule it runs the section's own **playground** against a line containing the phrase and
 * asserts what came out. That is the same call the import path makes, so a rule proven here is a rule
 * that works.
 *
 * Known bugs: DAM-B4 (the delete reports `Záznam bol upravený.`) and DAM-B5 (a rule switched to
 * `Nahradenie` stores its author but never applies it).
 */

let page: Page
let PHRASE_ID = ''
/** Recorded by the delete test and asserted by the DAM-B4 test that follows it. */
let DELETE_ALERT = ''

const PHRASE = `E2E${RAND_NUM}`
const AUTHOR_LINE = `${PHRASE} Jozef Novák`
/** An author that exists on every environment — the `Nahradenie` rule substitutes it. */
const REPLACEMENT_AUTHOR = 'TASR'

test.describe.serial(`${ADMIN_SUITE} - Author clean phrases`, () => {
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext()
    page = await ctx.newPage()
    await prepareUser(page)
    await openCleanPhrases(page)
  })

  test.afterAll(async () => {
    if (PHRASE_ID) await deleteCleanPhraseViaApi(page, PHRASE_ID)
    await page.context().close()
  })

  test('lists the rules with their operation and phrase type', async () => {
    expect(await tableHeaders(page)).toEqual(['Fráza', 'Operácia frázy', 'Typ frázy', 'Vytvorené', 'Upravené', ''])

    const phrases = await columnValues(page, COLUMN.phrase)
    expect(phrases.length, 'this environment holds clean phrase rules to assert against').toBeGreaterThan(0)
    expect(phrases[0].trim(), 'the first row carries a phrase').not.toBe('')
    expect((await columnValues(page, COLUMN.mode))[0].trim()).not.toBe('')
    expect((await columnValues(page, COLUMN.type))[0].trim()).not.toBe('')
  })

  test('creates a rule that strips a phrase', async () => {
    PHRASE_ID = await createCleanPhrase(page, {
      phrase: PHRASE,
      type: TYPE.word,
      mode: MODE.remove,
      wordBoundary: false,
      position: 500,
    })

    await openCleanPhraseDetail(page, PHRASE_ID)
    await expect(detailRow(page, 'Fráza')).toContainText(PHRASE)
    await expect(detailRow(page, 'Operácia frázy')).toContainText(MODE.remove)
    await expect(detailRow(page, 'Typ frázy')).toContainText(TYPE.word)
    await expect(detailRow(page, 'Poradie')).toContainText('500')
  })

  test('finds the new rule through the phrase filter', async () => {
    await openCleanPhrases(page)
    const table = cleanPhraseTable(page)
    await table.fillFilter('Fráza', PHRASE)
    await table.submitFilter()

    expect(await columnValues(page, COLUMN.phrase)).toEqual([PHRASE])
    await table.resetFilter()
  })

  test('strips the phrase out of an author line in the playground', async () => {
    const result = await runPlayground(page, AUTHOR_LINE)

    // The rule removes its phrase and nothing else, leaving the one author the line names.
    expect(result.authorNames).toEqual(['Jozef Novák'])
  })

  test('filters the rules down to one operation', async () => {
    await filterCleanPhrasesBy(page, 'Operácia frázy', MODE.replace)

    const modes = await columnValues(page, COLUMN.mode)
    expect(modes.length, 'the environment holds replacement rules').toBeGreaterThan(0)
    // Every row that came back carries the filtered operation — true whatever the environment holds.
    for (const mode of modes) expect(mode.trim()).toBe(MODE.replace)

    await cleanPhraseTable(page).resetFilter()
  })

  test('filters the rules down to one phrase type', async () => {
    await filterCleanPhrasesBy(page, 'Typ frázy', TYPE.word)

    const types = await columnValues(page, COLUMN.type)
    expect(types.length, 'the environment holds word rules').toBeGreaterThan(0)
    for (const type of types) expect(type.trim()).toBe(TYPE.word)

    await cleanPhraseTable(page).resetFilter()
  })

  test('turns the rule into one that substitutes an author', async () => {
    await updateCleanPhrase(page, PHRASE_ID, { mode: MODE.replace, authorReplacement: REPLACEMENT_AUTHOR })

    await openCleanPhraseDetail(page, PHRASE_ID)
    await expect(detailRow(page, 'Operácia frázy')).toContainText(MODE.replace)
    await expect(detailRow(page, 'Nahraď autorom')).toContainText(REPLACEMENT_AUTHOR)
  })

  test('applies the author of a rule that was switched to substitution @bug', async () => {
    test.fail() // DAM-B5: the switch is stored but never applied — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B5' })

    await openCleanPhrases(page)
    const result = await runPlayground(page, AUTHOR_LINE)

    // The phrase is still stripped — that much a `Odstránenie` rule does too …
    expect(result.authorNames).toEqual(['Jozef Novák'])
    // … but the substitution the rule now asks for never reaches the author list.
    expect(result.authors.join(' ')).toContain(REPLACEMENT_AUTHOR)
  })

  test('deletes the rule from its detail', async () => {
    await openCleanPhraseDetail(page, PHRASE_ID)
    DELETE_ALERT = await deleteOpenCleanPhrase(page)

    expect(await cleanPhraseStatus(page, PHRASE_ID), 'the deleted rule is gone').toBe(404)
    PHRASE_ID = ''
  })

  test('reports a deleted rule as deleted @bug', async () => {
    test.fail() // DAM-B4: the delete raises the update alert instead — see KNOWN-BUGS.md
    test.info().annotations.push({ type: 'bug', description: 'DAM-B4' })

    // The alert is the one the test above caught; deleting again would need another fixture.
    expect(DELETE_ALERT, 'an alert was raised by the delete').not.toBe('')
    expect(DELETE_ALERT).toContain(ALERT_DELETE)
  })
})
