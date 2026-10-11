import { useExtSystemIdForCached } from '@anzusystems/common-admin'
import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  initCurrentExtSystemAndLicence,
  useCurrentExtSystem,
} from '@/domains/coreDam/asset/composables/currentExtSystem'

vi.mock('@/domains/coreDam/asset/api/assetApi', () => ({
  fetchAsset: vi.fn(async () => ({ id: 'asset-1', licence: 50 })),
  fetchAssetByFileId: vi.fn(),
}))
vi.mock('@/domains/coreDam/assetLicence/api/assetLicenceApi', () => ({
  fetchAssetLicence: vi.fn(async () => ({ id: 50, extSystem: 5 })),
}))
vi.mock('@/domains/coreDam/asset/store/assetDetailStore', () => ({
  useAssetDetailStore: () => ({ directDetailLoad: false, setAsset: vi.fn() }),
}))
const currentUser = { value: {} as Record<string, unknown> }
vi.mock('@/domains/system/auth/auth', () => ({
  useAuth: () => ({ useCurrentUser: () => ({ currentUser }) }),
}))
// Declared here rather than inline in the factory: `defineStore(...)()` in one expression makes
// eslint-plugin-pinia throw while linting this file.
const useProbeDamConfigStore = defineStore('probeCachedExtSystemDamConfig', () => ({
  damPrvConfig: ref({
    settings: {
      allowSelectExtSystem: true,
      allowSelectLicenceId: true,
      defaultExtSystemId: 2,
      defaultAssetLicenceId: 20,
    },
  }),
  initialized: ref({ damPrvConfig: true }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigStore: () => useProbeDamConfigStore(),
}))

const expectExtSystem = (extSystem: number) => {
  expect(useCurrentExtSystem().currentExtSystemId.value).toBe(extSystem)
  expect(useExtSystemIdForCached().cachedExtSystemId.value).toBe(extSystem)
}

beforeEach(() => {
  setActivePinia(createPinia())
  useExtSystemIdForCached().cachedExtSystemId.value = 0
  currentUser.value = {
    id: 1,
    selectedLicenceDto: { id: 30, extSystem: 3 },
    assetLicencesDto: [{ id: 40, extSystem: 4 }],
  }
})

// The name caches of the library ask under their own ext system, so each way the start-up picks the current one has
// to write it there too.
describe('the ext system the name caches ask under', () => {
  it('is the one of the licence the user picked', async () => {
    expect(await initCurrentExtSystemAndLicence()).toBe(true)
    expectExtSystem(3)
  })

  it('is the one of their first licence when they picked none', async () => {
    currentUser.value.selectedLicenceDto = null

    expect(await initCurrentExtSystemAndLicence()).toBe(true)
    expectExtSystem(4)
  })

  it('is the default one when the configuration lets no one pick', async () => {
    useProbeDamConfigStore().damPrvConfig.settings.allowSelectExtSystem = false

    expect(await initCurrentExtSystemAndLicence()).toBe(true)
    expectExtSystem(2)
  })

  it('is the one of the licence of the asset a link opens', async () => {
    expect(await initCurrentExtSystemAndLicence({ type: 'assetId', id: '0192f7bc-7ab4-700c-9f3a-0b1c2d3e4f56' })).toBe(
      true
    )
    expectExtSystem(5)
  })
})
