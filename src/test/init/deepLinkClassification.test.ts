import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { ref } from 'vue'
import { AxiosError, AxiosHeaders } from 'axios'
// The real classes `useApiRequest` throws: the status is on `cause`, never on the error itself.
import { AnzuApiAxiosError, AnzuApiForbiddenError } from '@anzusystems/common-admin'

const fetchAsset = vi.fn()

vi.mock('@/domains/coreDam/asset/api/assetApi', () => ({
  fetchAsset: (...a: unknown[]) => fetchAsset(...(a as [])),
  fetchAssetByFileId: vi.fn(),
}))
const fetchAssetLicence = vi.fn(async (): Promise<unknown> => ({ id: 1, extSystem: 1 }))
vi.mock('@/domains/coreDam/assetLicence/api/assetLicenceApi', () => ({
  fetchAssetLicence: () => fetchAssetLicence(),
}))
vi.mock('@/domains/coreDam/asset/store/assetDetailStore', () => ({
  useAssetDetailStore: () => ({ directDetailLoad: false, setAsset: vi.fn() }),
}))
vi.mock('@/domains/system/auth/auth', () => ({
  useAuth: () => ({ useCurrentUser: () => ({ currentUser: { value: { id: 1, assetLicencesDto: [] } } }) }),
}))
// Declared here rather than inline in the factory: `defineStore(...)()` in one expression makes
// eslint-plugin-pinia throw while linting this file.
const useProbeDamConfigStore = defineStore('probeDamConfig', () => ({
  damPrvConfig: ref({ settings: { allowSelectExtSystem: false, allowSelectLicenceId: false } }),
  initialized: ref({ damPrvConfig: true }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigStore: () => useProbeDamConfigStore(),
}))

const axiosStatus = (status: number) => {
  const err = new AxiosError(`Request failed with status code ${status}`, 'ERR_BAD_REQUEST')
  err.response = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }

  return err
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  fetchAssetLicence.mockResolvedValue({ id: 1, extSystem: 1 })
})

describe('a deep link to an asset the server answers 404 for', () => {
  it('answers false, which the start-up turns into the not-found page', async () => {
    const { initCurrentExtSystemAndLicence } = await import(
      '@/domains/coreDam/asset/composables/currentExtSystem'
    )
    fetchAsset.mockRejectedValue(new AnzuApiAxiosError(axiosStatus(404)))

    await expect(
      initCurrentExtSystemAndLicence({ type: 'assetId', id: '0192f7bc-7ab4-700c-9f3a-0b1c2d3e4f56' })
    ).resolves.toBe(false)
    expect(fetchAsset).toHaveBeenCalledTimes(1)
  })

  it('reads the asset before it can be shown which licence it is in', async () => {
    const { initCurrentExtSystemAndLicence } = await import(
      '@/domains/coreDam/asset/composables/currentExtSystem'
    )
    fetchAsset.mockResolvedValue({ id: 'asset-1', licence: 1 })

    await expect(
      initCurrentExtSystemAndLicence({ type: 'assetId', id: '0192f7bc-7ab4-700c-9f3a-0b1c2d3e4f56' })
    ).resolves.toBe(true)
  })

  it('lets an outage through, so it is not reported as a missing asset', async () => {
    const { initCurrentExtSystemAndLicence } = await import(
      '@/domains/coreDam/asset/composables/currentExtSystem'
    )
    fetchAsset.mockRejectedValue(new AnzuApiAxiosError(axiosStatus(500)))

    // Answering `false` here would tell the user their asset had been deleted.
    await expect(
      initCurrentExtSystemAndLicence({ type: 'assetId', id: '0192f7bc-7ab4-700c-9f3a-0b1c2d3e4f56' })
    ).rejects.toBeDefined()
  })

  it('treats a refusal as a missing asset too', async () => {
    const { initCurrentExtSystemAndLicence } = await import(
      '@/domains/coreDam/asset/composables/currentExtSystem'
    )
    // `useApiRequest` has its own class for this one, so the check on `cause` cannot answer it.
    fetchAsset.mockRejectedValue(new AnzuApiForbiddenError())

    await expect(
      initCurrentExtSystemAndLicence({ type: 'assetId', id: '0192f7bc-7ab4-700c-9f3a-0b1c2d3e4f56' })
    ).resolves.toBe(false)
  })
})

describe('a deep link into a licence the user may not read', () => {
  it('answers false, the same as an asset that is not there', async () => {
    const { initCurrentExtSystemAndLicence } = await import(
      '@/domains/coreDam/asset/composables/currentExtSystem'
    )
    fetchAsset.mockResolvedValue({ id: 'asset-1', licence: 1 })
    fetchAssetLicence.mockRejectedValue(new AnzuApiForbiddenError())

    // Inside the same classification as the asset: a licence this user may not read is a link they cannot follow, not
    // an outage.
    await expect(
      initCurrentExtSystemAndLicence({ type: 'assetId', id: '0192f7bc-7ab4-700c-9f3a-0b1c2d3e4f56' })
    ).resolves.toBe(false)
  })

  it('still lets an outage on the licence through', async () => {
    const { initCurrentExtSystemAndLicence } = await import(
      '@/domains/coreDam/asset/composables/currentExtSystem'
    )
    fetchAsset.mockResolvedValue({ id: 'asset-1', licence: 1 })
    fetchAssetLicence.mockRejectedValue(new AnzuApiAxiosError(axiosStatus(500)))

    await expect(
      initCurrentExtSystemAndLicence({ type: 'assetId', id: '0192f7bc-7ab4-700c-9f3a-0b1c2d3e4f56' })
    ).rejects.toBeDefined()
  })
})
