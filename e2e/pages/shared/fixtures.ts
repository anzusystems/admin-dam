import * as crypto from 'crypto'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

export const TEST_DATA_BUCKET_URL = 'https://storage.googleapis.com/anzu-e2e-test-data-devel-bel'

export const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures')

export const IMAGE_TYPES = ['jpeg', 'png', 'gif', 'webp'] as const
export const AUDIO_TYPES = ['mp3', 'm4a', 'wav'] as const
export const VIDEO_TYPES = ['mp4', 'mov'] as const
export const DOCUMENT_TYPES = ['doc', 'pdf', 'xls', 'txt'] as const

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

export function fixture(file: string): string {
  return path.isAbsolute(file) ? file : path.join(FIXTURES_DIR, file)
}

/**
 * Write `content` to a file named `name` in its own directory and return the absolute path.
 * For files no suite uploads on purpose, such as a type the ext system does not accept. They are
 * not downloaded with the fixtures because the bucket holds only media that uploads successfully.
 */
export function tempFile(name: string, content: Buffer | string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'adam-e2e-'))
  const target = path.join(dir, name)
  fs.writeFileSync(target, content)
  return target
}

export function removeTempFile(file: string): void {
  try {
    fs.rmSync(path.dirname(file), { recursive: true, force: true })
  } catch {
    // a leftover in the OS temp directory is harmless
  }
}

/**
 * Copy a fixture under its own name with a random tail appended, so DAM stores it as a new file and
 * not a duplicate of the samples other suites upload (a duplicate main file leaves the asset a draft).
 * The tail is printable text: media decoders and document readers skip it, and a text
 * file stays `text/plain`. Raw random bytes would make it `application/octet-stream`.
 * `name` renames the copy. The asset list captions a tile with the original file name
 * until the asset has a title, so a unique name lets a test find an untitled upload.
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
