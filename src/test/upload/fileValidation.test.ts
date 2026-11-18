import { useFormatAndSizeCheck } from '@anzusystems/common-admin'
import { describe, expect, it } from 'vitest'

const file = (name: string, size: number, type = 'image/jpeg') => ({ name, size, type }) as File

const takes = (picked: File, accept: string | undefined, maxSizes: Record<string, number> | undefined) =>
  useFormatAndSizeCheck(accept, maxSizes).checkFormatsAndSizes([picked], true).length === 1

describe('the size limit', () => {
  it('takes a file that is exactly the limit', () => {
    // The backend accepts it: `AbstractAssetFileFacade` checks `size <=
    // sizeLimit`. Refusing it here turned a legal upload into an error message.
    expect(takes(file('photo.jpg', 100), undefined, { 'image/jpeg': 100 })).toBe(true)
    expect(takes(file('photo.jpg', 100), undefined, { 'image/*': 100 })).toBe(true)
    expect(takes(file('photo.jpg', 100), undefined, { '*': 100 })).toBe(true)
    expect(takes(file('photo.jpg', 100), undefined, { '.jpg': 100 })).toBe(true)
  })

  it('refuses a file over the limit through every form of the key', () => {
    // Regression: the wildcard and extension keys compared the limit the wrong way round, so these two passed.
    expect(takes(file('photo.jpg', 101), undefined, { '*': 100 })).toBe(false)
    expect(takes(file('photo.jpg', 101), undefined, { '.jpg': 100 })).toBe(false)
    expect(takes(file('photo.jpg', 101), undefined, { 'image/*': 100 })).toBe(false)
    expect(takes(file('photo.jpg', 101), undefined, { 'image/jpeg': 100 })).toBe(false)
  })

  it('takes a file under the limit through every form of the key', () => {
    // Regression: the first two of these were refused.
    expect(takes(file('photo.jpg', 99), undefined, { '*': 100 })).toBe(true)
    expect(takes(file('photo.jpg', 99), undefined, { '.jpg': 100 })).toBe(true)
    expect(takes(file('photo.jpg', 99), undefined, { 'image/*': 100 })).toBe(true)
    expect(takes(file('photo.jpg', 99), undefined, { 'image/jpeg': 100 })).toBe(true)
  })

  it('reads an extension key off the file name', () => {
    // Regression: without this check, an extension key matched any file.
    expect(takes(file('clip.mp4', 99, 'video/mp4'), undefined, { '.jpg': 100 })).toBe(false)
  })

  it('says yes when there is no limit to apply', () => {
    expect(takes(file('photo.jpg', 1_000), undefined, {})).toBe(true)
    expect(takes(file('photo.jpg', 1_000), undefined, undefined)).toBe(true)
  })
})

describe('the accepted formats', () => {
  it('matches an extension, a type and a type wildcard', () => {
    expect(takes(file('photo.JPG', 1), '.jpg', undefined)).toBe(true)
    expect(takes(file('photo.jpg', 1), 'image/jpeg', undefined)).toBe(true)
    expect(takes(file('photo.jpg', 1), 'image/*', undefined)).toBe(true)
    expect(takes(file('clip.mp4', 1, 'video/mp4'), 'image/*', undefined)).toBe(false)
  })

  it('accepts anything when nothing was asked for', () => {
    expect(takes(file('photo.jpg', 1), undefined, undefined)).toBe(true)
  })
})
