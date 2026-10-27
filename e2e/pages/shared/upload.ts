import * as fs from 'fs'
import { type Page, type Response, expect } from '@playwright/test'
import { ALERT_UPLOAD, CORE_DAM_API } from '@pages/shared/constants'
import { fixture } from '@pages/shared/fixtures'

export type UploadMode = 'select' | 'drag-drop'
export const UPLOAD_MODES: UploadMode[] = ['select', 'drag-drop']

/**
 * The POST that creates the file of a new asset, either from an uploaded file
 * (`/image/licence/100000`) or imported from an external provider
 * (`/image/licence/100000/external-provider`). Both answer with the same body, `asset` included.
 */
function isAssetFileCreate(response: Response): boolean {
  return (
    response.request().method() === 'POST' &&
    /\/(image|audio|video|document)\/licence\/\d+(\/external-provider)?$/.test(response.url().replace(CORE_DAM_API, ''))
  )
}

interface CreatedAsset {
  id: string
  /**
   * The `size` the app declared for the file it is uploading — absent for an external-provider import.
   */
  size?: number
}

/**
 * Collect every asset-file create that `action` triggers, in response order, and wait until `count` have landed.
 * Each body is read when its response arrives, because a navigation or reload afterwards discards it.
 */
async function createdAssets(page: Page, count: number, action: () => Promise<unknown>): Promise<CreatedAsset[]> {
  const created: Promise<CreatedAsset>[] = []
  const onResponse = (response: Response) => {
    if (!isAssetFileCreate(response)) return
    // Read off the *request*, which is what ties the answer back to the file that asked for it.
    const size = Number(JSON.parse(response.request().postData() || '{}').size)
    created.push(
      response.json().then((body) => {
        expect(body.asset, `asset id in ${response.url()}`).toBeTruthy()
        return { id: String(body.asset), size: Number.isFinite(size) ? size : undefined }
      })
    )
  }
  page.on('response', onResponse)
  try {
    await action()
    await expect.poll(() => created.length, { timeout: 60000 }).toBe(count)
  } finally {
    page.off('response', onResponse)
  }
  return Promise.all(created)
}

export async function createdAssetIds(page: Page, count: number, action: () => Promise<unknown>): Promise<string[]> {
  return (await createdAssets(page, count, action)).map((asset) => asset.id)
}

/**
 * Put the created assets back into the order their files were handed to the upload, by the declared
 * `size`. The request body is just `{mimeType, size}`, so size is the only way to tell the files apart.
 * The app uploads a batch concurrently, so responses arrive in backend finish
 * order. A caller reading the result by position would get files swapped.
 * Files of the same size are indistinguishable and keep response order, which is fine for interchangeable copies.
 */
function inUploadOrder(paths: string[], created: CreatedAsset[]): string[] {
  const remaining = [...created]
  return paths.map((path) => {
    const size = fs.statSync(path).size
    const index = remaining.findIndex((asset) => asset.size === size)
    return remaining.splice(index === -1 ? 0 : index, 1)[0].id
  })
}

/**
 * Upload fixture files to the current licence and return the created asset ids, in upload order.
 * `select` sets the files on the hidden upload input. `drag-drop` drags them in through the
 * Chrome DevTools protocol: the app reads dropped files via `webkitGetAsEntry()`, which is
 * null for a DataTransfer built in page script, so a synthetic drop would upload nothing.
 */
export async function uploadFiles(page: Page, files: string[], mode: UploadMode = 'select'): Promise<string[]> {
  const paths = files.map(fixture)
  const created = await createdAssets(page, paths.length, async () => {
    if (mode === 'select') {
      await page.locator('input[type="file"]').first().setInputFiles(paths)
    } else {
      await dragFilesOntoPage(page, paths)
    }
  })
  return inUploadOrder(paths, created)
}

export async function uploadFile(page: Page, file: string, mode: UploadMode = 'select'): Promise<string> {
  const [id] = await uploadFiles(page, [file], mode)
  return id
}

async function dragFilesOntoPage(page: Page, paths: string[]): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1920, height: 1080 }
  const x = Math.round(viewport.width / 2)
  const y = Math.round(viewport.height / 2)
  const data = { items: [], files: paths, dragOperationsMask: 1 }
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send('Input.dispatchDragEvent', { type: 'dragEnter', x, y, data })
    await cdp.send('Input.dispatchDragEvent', { type: 'dragOver', x, y, data })
    // The fullscreen dropzone only mounts once the app has seen a file dragged over the window.
    await expect(page.locator('.dam-upload-dropzone--fullscreen')).toBeVisible()
    await cdp.send('Input.dispatchDragEvent', { type: 'dragOver', x, y, data })
    await cdp.send('Input.dispatchDragEvent', { type: 'drop', x, y, data })
  } finally {
    await cdp.detach()
  }
}

export async function waitForUpload(page: Page, text = ALERT_UPLOAD, timeout = 90000): Promise<void> {
  await expect(page.locator('[data-cy="upload-overlay-title"]')).toContainText(text, { timeout })
}

export async function finishUpload(page: Page): Promise<void> {
  await page.locator('[data-cy="button-add-description"]').click()
  await page.locator('.v-overlay--active [data-cy="button-close"]').first().click()
}

export async function uploadAndDescribe(page: Page, file: string, assetName?: string): Promise<string> {
  const id = await uploadFile(page, file)
  await waitForUpload(page)
  await page.locator('[data-cy="button-add-description"]').click()
  if (assetName) {
    await page.locator('.v-overlay--active .v-field__input').first().fill(assetName)
  }
  await page.locator('.v-overlay--active .v-btn').filter({ hasText: 'Uložiť a ukončiť' }).click()
  return id
}

export async function waitForAssetList(page: Page): Promise<void> {
  await page.waitForResponse((response) => response.url().startsWith(`${CORE_DAM_API}/asset/licence/search`), {
    timeout: 30000,
  })
}
