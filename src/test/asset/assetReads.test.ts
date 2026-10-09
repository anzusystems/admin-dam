import { defaultApiErrorLogger, setApiErrorLogger } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The reads that ask about several things at once: the assets of a licence by their ids, and the files of the
 * slots of an asset. Each must tell an answer it cannot use from "there is none": to the poll of the upload queue
 * a file that is missing from an answer is a file the server does not know.
 *
 * The poll's own two reads are run both ways it calls them: with a failure written down (the api error logger)
 * and with it kept quiet. What is refused must not depend on which. */

let server: FakeDam
let logged: Array<{ url: string | undefined; status: number | undefined }>

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const assetApi = async () => await import('@/domains/coreDam/asset/api/assetApi')
const assetSlotApi = async () => await import('@/domains/coreDam/asset/api/assetSlotApi')

const BY_IDS = /^\/adm\/v1\/asset\/licence\/7\/ids\//
const idsAsked = () => server.sent('GET', BY_IDS).map((request) => request.url.split('/ids/')[1].split(','))
const many = (count: number) => Array.from({ length: count }, (_, index) => 'asset-' + (index + 1))

/* What an answer without its list looks like. Read as an empty list it would say "none of these exist". The last
 * column: an answer with no body at all is refused by the request itself, which writes it down when it is let; a
 * body that is there and carries no list is refused by its reader, and written down by nobody. */
const noList: Array<[string, { status: number; data?: unknown }, boolean]> = [
  ['no body', { status: 200 }, true],
  ['no content at all (204)', { status: 204 }, true],
  ['a body without the list', { status: 200, data: { totalCount: 0 } }, false],
  [
    'something else in place of the list',
    { status: 200, data: { data: { 'asset-1': assetDetail('asset-1') } } },
    false,
  ],
  ['a text in place of the list', { status: 200, data: { data: 'no list' } }, false],
]

const ways: Array<[string, boolean]> = [
  ['a failure of it written down', true],
  ['a failure of it kept quiet', false],
]

beforeEach(() => {
  vi.clearAllMocks()
  server = createFakeDam()
  logged = []
  setApiErrorLogger((_error, context) => {
    logged.push({ url: context.url, status: context.status })
  })
})

afterEach(() => {
  setApiErrorLogger(defaultApiErrorLogger)
})

// What the mass edit loads its selection with.
describe('the read of several assets by their ids', () => {
  it('asks for up to fifty of them in one request, under the licence', async () => {
    const { fetchAssetListByIds } = await assetApi()
    many(50).forEach((id) => server.asset(assetDetail(id)))

    const found = await fetchAssetListByIds(many(50), 7)

    expect(idsAsked()).toEqual([many(50)])
    expect(found.map((asset) => asset.id)).toEqual(many(50))
  })

  it('asks for more than fifty in requests of fifty, and answers with all of them', async () => {
    const { fetchAssetListByIds } = await assetApi()
    many(101).forEach((id) => server.asset(assetDetail(id)))

    const found = await fetchAssetListByIds(many(101), 7)

    expect(idsAsked().map((ids) => ids.length)).toEqual([50, 50, 1])
    expect(found.map((asset) => asset.id)).toEqual(many(101))
  })

  it('answers without an asset the licence does not hold', async () => {
    const { fetchAssetListByIds } = await assetApi()
    server.asset(assetDetail('asset-1'))

    const found = await fetchAssetListByIds(['asset-1', 'asset-gone'], 7)

    expect(found.map((asset) => asset.id)).toEqual(['asset-1'])
  })

  it.each(noList)('is refused when the answer carries %s', async (_name, answer) => {
    const { fetchAssetListByIds } = await assetApi()
    server.on('GET', BY_IDS, () => answer)

    await expect(fetchAssetListByIds(['asset-1', 'asset-2'], 7)).rejects.toBeDefined()
  })

  it('is refused when one of its requests is, whatever the others brought, and writes nothing down', async () => {
    const { fetchAssetListByIds } = await assetApi()
    let requests = 0
    server.on('GET', BY_IDS, () => {
      requests++
      if (requests === 2) throw httpError(500)

      return { status: 200, data: { data: [assetDetail('asset-1')] } }
    })

    await expect(fetchAssetListByIds(many(51), 7)).rejects.toBeDefined()
    expect(logged).toEqual([])
  })
})

describe.each(ways)('the read of the assets the upload queue waits for, with %s', (_way, report) => {
  it('asks for up to fifty of them in one request, under the licence, by the address the list read uses', async () => {
    const { fetchWaitingAssets } = await assetApi()
    many(50).forEach((id) => server.asset(assetDetail(id)))

    const found = await fetchWaitingAssets(many(50), 7, { report })

    expect(server.sent('GET').map((request) => request.url)).toEqual([
      '/adm/v1/asset/licence/7/ids/' + many(50).join(','),
    ])
    expect(found.map((asset) => asset.id)).toEqual(many(50))
    expect(logged).toEqual([])
  })

  it('asks for more than fifty in requests of fifty, and answers with all of them', async () => {
    const { fetchWaitingAssets } = await assetApi()
    many(101).forEach((id) => server.asset(assetDetail(id)))

    const found = await fetchWaitingAssets(many(101), 7, { report })

    expect(idsAsked().map((ids) => ids.length)).toEqual([50, 50, 1])
    expect(found.map((asset) => asset.id)).toEqual(many(101))
  })

  it('answers without an asset the licence does not hold', async () => {
    const { fetchWaitingAssets } = await assetApi()
    server.asset(assetDetail('asset-1'))

    const found = await fetchWaitingAssets(['asset-1', 'asset-gone'], 7, { report })

    expect(found.map((asset) => asset.id)).toEqual(['asset-1'])
    expect(logged).toEqual([])
  })

  it.each(noList)('is refused when the answer carries %s', async (_name, answer, refusedByTheRequest) => {
    const { fetchWaitingAssets } = await assetApi()
    server.on('GET', BY_IDS, () => answer)

    await expect(fetchWaitingAssets(['asset-1', 'asset-2'], 7, { report })).rejects.toBeDefined()
    expect(logged).toHaveLength(report && refusedByTheRequest ? 1 : 0)
  })

  it('is refused when one of its requests is, whatever the others brought', async () => {
    const { fetchWaitingAssets } = await assetApi()
    let requests = 0
    server.on('GET', BY_IDS, () => {
      requests++
      if (requests === 2) throw httpError(500)

      return { status: 200, data: { data: [assetDetail('asset-1')] } }
    })

    await expect(fetchWaitingAssets(many(51), 7, { report })).rejects.toBeDefined()
    // The request that failed, once, or nothing: as the caller said.
    expect(logged).toEqual(report ? [{ url: '/adm/v1/asset/licence/7/ids/asset-51', status: 500 }] : [])
  })
})

describe.each(ways)('the read of the files of the slots of an asset, with %s', (_way, report) => {
  it('answers with the file of every slot, and with nothing for a slot that holds none', async () => {
    const { fetchAssetSlotFiles } = await assetSlotApi()
    server.slotFile('asset-1', 'default', assetFile('file-1', 'processed'))
    server.slotFile('asset-1', 'extra', assetFile('file-2', 'stored'))
    server.slotFile('asset-1', 'bonus', null)

    const files = await fetchAssetSlotFiles('asset-1', { report })

    expect(server.sent('GET').map((request) => request.url)).toEqual(['/adm/v1/asset-slot/asset/asset-1'])
    expect(files.map((file) => (file ? [file.id, file.fileAttributes.status] : null))).toEqual([
      ['file-1', 'processed'],
      ['file-2', 'stored'],
      null,
    ])
    expect(logged).toEqual([])
  })

  it('answers with no file for an asset that has no slot yet', async () => {
    const { fetchAssetSlotFiles } = await assetSlotApi()
    server.asset(assetDetail('asset-1', { mainFile: null }))

    expect(await fetchAssetSlotFiles('asset-1', { report })).toEqual([])
  })

  // Read as an empty list it would say "the file is in none of the slots".
  it.each(noList)('is refused when the answer carries %s', async (_name, answer, refusedByTheRequest) => {
    const { fetchAssetSlotFiles } = await assetSlotApi()
    server.on('GET', /^\/adm\/v1\/asset-slot\/asset\/asset-1$/, () => answer)

    await expect(fetchAssetSlotFiles('asset-1', { report })).rejects.toBeDefined()
    expect(logged).toHaveLength(report && refusedByTheRequest ? 1 : 0)
  })

  it.each([404, 500])('is refused when the server answers %s', async (status) => {
    const { fetchAssetSlotFiles } = await assetSlotApi()
    server.slotsBy('asset-1', () => {
      throw httpError(status)
    })

    await expect(fetchAssetSlotFiles('asset-1', { report })).rejects.toBeDefined()
    expect(logged).toEqual(report ? [{ url: '/adm/v1/asset-slot/asset/asset-1', status }] : [])
  })
})
