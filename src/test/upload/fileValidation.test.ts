import { describe, expect, it } from 'vitest'
import { checkFormats, checkSizes } from '@/domains/coreDam/shared/services/upload/fileValidation'

const file = (name: string, size: number, type = 'image/jpeg') =>
  ({ name, size, type }) as File

describe('the size limit', () => {
  it('takes a file that is exactly the limit', () => {
    // The backend does - `AbstractAssetFileFacade` asks `size <= sizeLimit` - so refusing it here turned a legal
    // upload into an error message.
    expect(checkSizes(file('photo.jpg', 100), ['image/jpeg'], { 'image/jpeg': 100 })).toBe(true)
    expect(checkSizes(file('photo.jpg', 100), ['image/*'], { 'image/*': 100 })).toBe(true)
    expect(checkSizes(file('photo.jpg', 100), ['*'], { '*': 100 })).toBe(true)
    expect(checkSizes(file('photo.jpg', 100), ['.jpg'], { '.jpg': 100 })).toBe(true)
  })

  it('refuses a file over the limit through every form of the key', () => {
    // The first two used to pass: the wildcard and extension keys compared the limit the other
    // way about.
    expect(checkSizes(file('photo.jpg', 101), ['*'], { '*': 100 })).toBe(false)
    expect(checkSizes(file('photo.jpg', 101), ['.jpg'], { '.jpg': 100 })).toBe(false)
    expect(checkSizes(file('photo.jpg', 101), ['image/*'], { 'image/*': 100 })).toBe(false)
    expect(checkSizes(file('photo.jpg', 101), ['image/jpeg'], { 'image/jpeg': 100 })).toBe(false)
  })

  it('takes a file under the limit through every form of the key', () => {
    // And the first two of these were refused.
    expect(checkSizes(file('photo.jpg', 99), ['*'], { '*': 100 })).toBe(true)
    expect(checkSizes(file('photo.jpg', 99), ['.jpg'], { '.jpg': 100 })).toBe(true)
    expect(checkSizes(file('photo.jpg', 99), ['image/*'], { 'image/*': 100 })).toBe(true)
    expect(checkSizes(file('photo.jpg', 99), ['image/jpeg'], { 'image/jpeg': 100 })).toBe(true)
  })

  it('reads an extension key off the file name', () => {
    // Without that it matched any file at all, whatever the key said.
    expect(checkSizes(file('clip.mp4', 99, 'video/mp4'), ['.jpg'], { '.jpg': 100 })).toBe(false)
  })

  it('says yes when there is no limit to apply', () => {
    expect(checkSizes(file('photo.jpg', 1_000), [], { '*': 1 })).toBe(true)
    expect(checkSizes(file('photo.jpg', 1_000), ['*'], undefined)).toBe(true)
  })
})

describe('the accepted formats', () => {
  it('matches an extension, a type and a type wildcard', () => {
    expect(checkFormats(file('photo.JPG', 1), ['.jpg'])).toBe(true)
    expect(checkFormats(file('photo.jpg', 1), ['image/jpeg'])).toBe(true)
    expect(checkFormats(file('photo.jpg', 1), ['image/*'])).toBe(true)
    expect(checkFormats(file('clip.mp4', 1, 'video/mp4'), ['image/*'])).toBe(false)
  })

  it('accepts anything when nothing was asked for', () => {
    expect(checkFormats(file('photo.jpg', 1), [])).toBe(true)
  })
})
