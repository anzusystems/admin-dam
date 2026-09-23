import { type Page, type Response, expect } from '@playwright/test'
import { CORE_DAM_API } from '@pages/shared/constants'

/**
 * The ext system this suite's licence belongs to. Its configuration declares what each asset type may do —
 * which slots it offers, which ratio its crop previews use — and the rest of the suite pins the same one
 * (`asset-custom-form/ext-system/1`, `podcast/ext-system/1`).
 */
const EXT_SYSTEM_ID = 1

export type AssetType = 'image' | 'audio' | 'video' | 'document'

/**
 * The ext system's configuration for one asset type: `slots`, `defaultSlotName`, `roiWidth`/`roiHeight`,
 * the size limit and the accepted mime types.
 *
 * The slots tab and the "Fókus" previews are both built from this, so reading it lets a test assert the UI
 * against the app's own configuration instead of against a list copied into the spec.
 */
export async function assetTypeConfig(page: Page, assetType: AssetType): Promise<any> {
  const response = await page.request.get(`${CORE_DAM_API}/configuration/ext-system/${EXT_SYSTEM_ID}`)
  expect(response.status(), 'GET ext system configuration').toBe(200)
  const config = (await response.json())[assetType]
  expect(config, `configuration of asset type ${assetType}`).toBeTruthy()
  return config
}

/** One slot of an asset as the API reports it — a slot holding no file is not listed at all. */
export interface SlotFile {
  fileId: string
  main: boolean
  size: number
  mimeType: string
  originFileName: string
}

/**
 * The file each slot of an asset holds, keyed by slot name. This is the only way to tie a slot row in the
 * sidebar to a file id: the rows carry the file *name*, never its id.
 */
export async function slotFiles(page: Page, assetId: string): Promise<Record<string, SlotFile>> {
  const response = await page.request.get(`${CORE_DAM_API}/asset-slot/asset/${assetId}`)
  expect(response.status(), `GET slots of asset ${assetId}`).toBe(200)
  const slots: Record<string, SlotFile> = {}
  for (const slot of (await response.json()).data) {
    if (!slot.assetFile) continue
    slots[slot.slotName] = {
      fileId: slot.assetFile.id,
      main: slot.main,
      size: slot.assetFile.fileAttributes.size,
      mimeType: slot.assetFile.fileAttributes.mimeType,
      originFileName: slot.assetFile.fileAttributes.originFileName,
    }
  }
  return slots
}

/**
 * The file the next `…/download-link` request answers for, as `{ id, link }`. Both the slot menu's
 * "Stiahnuť" and the sidebar's download dialog ask for one, and the answer is the only place the file id
 * behind the offered link is visible.
 */
export function downloadLink(page: Page): Promise<{ id: string; link: string }> {
  return page
    .waitForResponse((response: Response) => response.url().endsWith('/download-link'))
    .then(async (response) => {
      expect(response.ok(), `download link responds ${response.status()}`).toBeTruthy()
      return response.json()
    })
}

/**
 * Assert a signed download link really serves the stored file.
 *
 * The link is served as an attachment, so the browser never navigates to it and there is no page to assert
 * on — the file is checked by requesting it directly and comparing what the asset API says it should be.
 */
export async function expectDownloadedFile(
  page: Page,
  link: string,
  expected: { mimeType: string; size: number }
): Promise<void> {
  const response = await page.request.get(link)
  expect(response.status(), 'the download link serves the file').toBe(200)
  const headers = response.headers()
  expect(headers['content-disposition'], 'the file is served as a download').toContain('attachment')
  expect(headers['content-type']).toContain(expected.mimeType)
  expect(Number(headers['content-length']), 'the served file is the stored one').toBe(expected.size)
}

/** Fetch an asset through the admin API, using the browser session's cookies. */
export async function getAsset(page: Page, assetId: string): Promise<any> {
  const response = await page.request.get(`${CORE_DAM_API}/asset/${assetId}`)
  expect(response.status(), `GET asset ${assetId}`).toBe(200)
  return response.json()
}

/** Delete an asset. A 404 is accepted, so cleanup can run for assets a test already deleted. */
export async function deleteAsset(page: Page, assetId: string): Promise<void> {
  const response = await page.request.delete(`${CORE_DAM_API}/asset/${assetId}`)
  expect([204, 404], `DELETE asset ${assetId}`).toContain(response.status())
}

/** Best-effort cleanup of every asset in `assetIds` — never fails the caller. */
export async function cleanupAssets(page: Page, assetIds: string[]): Promise<void> {
  for (const id of assetIds) {
    await deleteAsset(page, id).catch(() => {})
  }
}

/**
 * Poll an asset until its main file reaches one of the `done` statuses (by default `processed`), and return
 * it. Fails fast when processing failed.
 */
export async function waitForAssetProcessed(
  page: Page,
  assetId: string,
  { done = ['processed'], timeout = 90000 }: { done?: string[]; timeout?: number } = {}
): Promise<any> {
  let asset: any
  await expect(async () => {
    asset = await getAsset(page, assetId)
    const status = asset.mainFile?.fileAttributes?.status
    if (status === 'failed') {
      throw new Error(`asset ${assetId} failed to process: ${asset.mainFile.fileAttributes.failReason}`)
    }
    expect(done, `processing status of asset ${assetId}`).toContain(status)
  }).toPass({ intervals: [1000, 2000, 3000], timeout })
  return asset
}

/** Mime subtype the backend stores for a fixture extension, where it differs from the extension itself. */
const MIME_SUBTYPE: Record<string, string> = {
  mp3: 'mpeg',
  mov: 'quicktime',
  wav: 'x-wav',
  doc: 'msword',
  xls: 'vnd.ms-excel',
  txt: 'plain',
}

/**
 * Assert the stored main file of an asset has the mime type expected for a fixture of `extension`, once the
 * upload finished. A `duplicate` file counts as finished too: it is stored and typed the same way, and an
 * identical file deleted moments earlier can still be matched as its original.
 */
export async function expectAssetMimeType(
  page: Page,
  assetId: string,
  group: 'image' | 'audio' | 'video' | 'application',
  extension: string
): Promise<void> {
  const asset = await waitForAssetProcessed(page, assetId, { done: ['processed', 'duplicate'] })
  const mimeType: string = asset.mainFile?.fileAttributes?.mimeType ?? ''
  expect(mimeType).toContain(extension === 'txt' ? 'text' : group)
  expect(mimeType).toContain(MIME_SUBTYPE[extension] ?? extension)
}
