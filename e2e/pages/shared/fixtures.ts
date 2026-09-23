import * as crypto from 'crypto'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

/** Public bucket holding the media files the upload tests use. */
export const TEST_DATA_BUCKET_URL = 'https://storage.googleapis.com/anzu-e2e-test-data-devel-bel'

export const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures')

export const IMAGE_TYPES = ['jpeg', 'png', 'gif', 'webp'] as const
export const AUDIO_TYPES = ['mp3', 'm4a', 'wav'] as const
export const VIDEO_TYPES = ['mp4', 'mov'] as const
export const DOCUMENT_TYPES = ['doc', 'pdf', 'xls', 'txt'] as const

/** Every file globalSetup downloads, relative to FIXTURES_DIR. */
export const FIXTURE_FILES: string[] = [
  ...IMAGE_TYPES.map((type) => `image/sample.${type}`),
  ...AUDIO_TYPES.map((type) => `audio/sample.${type}`),
  ...VIDEO_TYPES.map((type) => `video/sample.${type}`),
  ...DOCUMENT_TYPES.map((type) => `document/sample.${type}`),
  'audio/sample2.mp3',
  'image/animation.gif',
  'image/sampleMeta1.jpg',
  'image/sampleMeta2.jpg',
]

/** Absolute path of a fixture, e.g. `fixture('audio/sample.mp3')`. Absolute paths are returned as they are. */
export function fixture(file: string): string {
  return path.isAbsolute(file) ? file : path.join(FIXTURES_DIR, file)
}

/**
 * Write `content` to a file named `name` in a directory of its own, and return the absolute path.
 *
 * For the files no suite uploads on purpose — a type the ext system does not accept, say. Those are
 * built here rather than downloaded with the fixtures, because the bucket holds the media the suite
 * uploads *successfully* and a file that exists only to be refused has no business there.
 */
export function tempFile(name: string, content: Buffer | string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adam-e2e-'))
  const target = path.join(dir, name)
  fs.writeFileSync(target, content)
  return target
}

/** Remove a file made by `tempFile`, directory and all. Best-effort — cleanup only. */
export function removeTempFile(file: string): void {
  try {
    fs.rmSync(path.dirname(file), { recursive: true, force: true })
  } catch {
    // a leftover in the OS temp directory is harmless
  }
}

/**
 * Copy a fixture under its own name with a random tail appended, so DAM stores it as a new file instead of a
 * duplicate of the samples other suites upload (a duplicate main file leaves the asset a draft). The tail is
 * printable text: media decoders and document readers skip it, and a text file stays `text/plain` - raw random
 * bytes would turn it into `application/octet-stream`. Returns the absolute path of the copy.
 *
 * `name` renames the copy. The asset list captions a tile with the original file name until the asset
 * has a title, so a unique name is what lets a test find an untitled upload among the tiles.
 */
export function uniqueFixtureCopy(file: string, name?: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adam-e2e-'))
  const target = path.join(dir, name ?? path.basename(file))
  fs.writeFileSync(
    target,
    Buffer.concat([fs.readFileSync(fixture(file)), Buffer.from(`\n${crypto.randomBytes(2048).toString('hex')}\n`)])
  )
  return target
}
