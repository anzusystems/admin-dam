import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

import { addLegacyRedirects } from '@/router/legacyRedirects'

/*
 * Old log addresses: `/log` (before 2.0.0) and `/logs` (2.x), with the detail at `:system/:type/:id`.
 * The system is now the fixed `dam` segment, so the rest of such an address cannot be appended to the new list.
 * A detail used to end on the catch-all page.
 */

const ID = '0123456789abcdef01234567'
const NOT_FOUND = '/[...pathMatch]'

const landsOn = async (address: string) => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  addLegacyRedirects(router)
  await router.push(address)
  const { fullPath, name } = router.currentRoute.value

  return [fullPath, name]
}

describe('a log address from before this version', () => {
  it.each(['/log', '/log/', '/logs', '/logs/'])('%s opens the list of the app logs', async (address) => {
    expect(await landsOn(address)).toEqual(['/logs/dam/app', '/(common)/logs/dam/[type]'])
  })

  it.each([
    ['/log/coreDam/audit/' + ID, '/logs/dam/audit/' + ID],
    ['/log/adminDam/app/' + ID, '/logs/dam/app/' + ID],
    ['/logs/coreDam/audit/' + ID, '/logs/dam/audit/' + ID],
  ])('%s opens the detail of that log', async (address, detail) => {
    expect(await landsOn(address)).toEqual([detail, '/(common)/logs/dam/[type]/[id]'])
  })

  it('keeps the query and the hash', async () => {
    expect(await landsOn('/log/coreDam/app/' + ID + '?from=bookmark#top')).toEqual([
      '/logs/dam/app/' + ID + '?from=bookmark#top',
      '/(common)/logs/dam/[type]/[id]',
    ])
  })

  it.each(['/log/coreDam', '/log/coreDam/audit', '/logs/coreDam/audit/not-a-log-id'])(
    '%s, which no log page ever had, is not found',
    async (address) => {
      expect((await landsOn(address))[1]).toBe(NOT_FOUND)
    }
  )
})

// The redirect of the old detail has the shape of the current one, so it must leave current addresses to their pages.
describe('a current log address', () => {
  it.each([
    ['/logs/dam/audit', '/(common)/logs/dam/[type]'],
    ['/logs/dam/audit/' + ID, '/(common)/logs/dam/[type]/[id]'],
  ])('%s stays as it is', async (address, name) => {
    expect(await landsOn(address)).toEqual([address, name])
  })

  it('with an id the detail refuses is not found, and is not redirected onto itself', async () => {
    expect(await landsOn('/logs/dam/audit/not-a-log-id')).toEqual(['/logs/dam/audit/not-a-log-id', NOT_FOUND])
  })
})
