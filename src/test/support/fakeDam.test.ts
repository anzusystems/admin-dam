import { describe, expect, it } from 'vitest'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'

/*
 * Every read of an asset, a file or the slots of an asset returns a new object, as a real server does.
 * The application writes into what it receives (the detail into its asset, a mass operation into the row custom data).
 * If the stored object were handed out, later reads would return those writes,
 * and a case about the asset as the server has it could pass on wrong code.
 */

type Answered = { keywords: string[]; metadata: { customData: Record<string, unknown> } }

describe('the fake server', () => {
  const written = (asset: Answered) => {
    asset.keywords.push('written by the application')
    asset.metadata.customData.title = 'written by the application'
  }
  const asStored = { keywords: ['keyword-server'], metadata: { customData: { title: 'from the server' } } }

  it('answers each read of an asset with a copy: what is written into one answer is not in the next', async () => {
    const server = createFakeDam()
    server.asset(assetDetail('asset-1'))

    written((await server.client.get('/adm/v1/asset/asset-1')).data as Answered)

    expect((await server.client.get('/adm/v1/asset/asset-1')).data).toMatchObject(asStored)
  })

  it('answers a read of several assets with copies as well, and of an asset answered by a function', async () => {
    const server = createFakeDam()
    server.asset(assetDetail('asset-1'))
    const answeredByFunction = assetDetail('asset-2')
    server.assetBy('asset-2', () => answeredByFunction)
    const several = '/adm/v1/asset/licence/1/ids/asset-1,asset-2'

    ;((await server.client.get(several)).data as { data: Answered[] }).data.forEach(written)

    expect((await server.client.get(several)).data).toMatchObject({ data: [asStored, asStored] })
    expect((await server.client.get('/adm/v1/asset/asset-2')).data).toMatchObject(asStored)
  })

  it('answers a read of a file and of the slots of an asset with copies too', async () => {
    const server = createFakeDam()
    server.asset(assetDetail('asset-1'))
    const file = assetFile('file-1', 'processed')
    server.file('image', file)
    server.slotFile('asset-1', 'default', file)
    const asFileStored = structuredClone(file)

    Object.assign((await server.client.get('/adm/v1/image/file-1')).data as object, { id: 'written' })
    const slotsRead = (await server.client.get('/adm/v1/asset-slot/asset/asset-1')).data as {
      data: Array<{ assetFile: object }>
    }
    Object.assign(slotsRead.data[0].assetFile, { id: 'written' })

    expect((await server.client.get('/adm/v1/image/file-1')).data).toEqual(asFileStored)
    expect((await server.client.get('/adm/v1/asset-slot/asset/asset-1')).data).toMatchObject({
      data: [{ assetFile: asFileStored }],
    })
  })
})

/*
 * Axios settles an answer by the request `validateStatus`; without one only a 2xx is an answer.
 * The fake used to return every answer, so cases about refused requests had to set this up themselves.
 */
describe('the answers of the fake server', () => {
  const answering = (status: number) => {
    const server = createFakeDam()
    server.on('PATCH', /^\/adm\/v1\/answered$/, () => ({ status, data: { status } }))

    return server.client
  }
  const statusOf = (answer: Promise<{ status: number }>) =>
    answer.then(
      (answered) => answered.status,
      (error: { response?: { status: number } }) => 'refused ' + error.response?.status
    )

  it('are refused as axios refuses them: not a 2xx without a rule of the request, and by the rule of the request', async () => {
    const only200 = { validateStatus: (status: number) => status === 200 }

    expect(
      await Promise.all([
        statusOf(answering(204).patch('/adm/v1/answered')),
        statusOf(answering(422).patch('/adm/v1/answered')),
        statusOf(answering(204).patch('/adm/v1/answered', undefined, only200)),
        statusOf(answering(200).patch('/adm/v1/answered', undefined, only200)),
      ])
    ).toEqual([204, 'refused 422', 'refused 204', 200])
  })
})
