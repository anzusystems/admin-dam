import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { type Page, expect } from '@playwright/test'
import { waitForAssetProcessed } from '@pages/shared/api'
import { finishUpload, uploadFile, waitForUpload } from '@pages/shared/upload'

/** Copy `file` byte for byte, under the same name, into a fresh temporary directory. */
function identicalCopy(file: string): string {
  const target = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'adam-e2e-')), path.basename(file))
  fs.copyFileSync(file, target)
  return target
}

/** Duplicate markers in the upload queue of the upload overlay. */
function duplicateIcons(page: Page) {
  return page.locator('.asset-upload-overlay .dam-upload-queue--list [data-cy="icon-duplicate"]')
}

/**
 * Upload `file` twice into the current licence: the first copy must not be marked as a duplicate, the second
 * one must. Pass a `uniqueFixtureCopy` so no earlier run's asset can be the original. Closes the upload overlay
 * afterwards and returns the ids of both assets for cleanup.
 */
export async function expectDuplicateOnSecondUpload(page: Page, file: string): Promise<string[]> {
  const first = await uploadFile(page, file)
  await waitForUpload(page)
  // The duplicate marker follows the processed status, so wait for it before asserting there is none.
  await waitForAssetProcessed(page, first)
  await expect(duplicateIcons(page)).toHaveCount(0)

  // Same bytes and name from another path: picking the very same path again does not always fire `change`.
  const second = await uploadFile(page, identicalCopy(file))
  await waitForUpload(page)
  await waitForAssetProcessed(page, second, { done: ['duplicate'] })
  await expect(duplicateIcons(page)).toHaveCount(1, { timeout: 20000 })

  await finishUpload(page)
  return [first, second]
}
