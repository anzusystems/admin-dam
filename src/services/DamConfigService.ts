import type { DamConfig } from '@/types/dam/DamConfig'
import { fetchConfiguration } from '@/services/api/dam/configurationApi'
import { ref } from 'vue'

export const damConfigInitialized = ref(false)

export const damConfig: DamConfig = {
  colorSet: {},
  assetExternalProviders: {},
  distributionServices: {},
  settings: {
    aclCheckEnabled: true,
    adminAllowListName: 'root',
    allowSelectExtSystem: false,
    allowSelectLicenceId: false,
    defaultAssetLicenceId: 0,
    defaultExtSystemId: 0,
    imageChunkConfig: {
      minSize: 0,
      maxSize: 0,
    },
    maxBulkItemCount: 0,
  },
}

const setDamConfig = (data: DamConfig) => {
  try {
    damConfig.settings = data.settings
    damConfig.colorSet = data.colorSet
    damConfig.assetExternalProviders = data.assetExternalProviders
    damConfig.distributionServices = data.distributionServices

    damConfigInitialized.value = true
  } catch (err) {
    throw new Error('Unable to load dam config. Incorrect fields in json.')
  }
}

const onConfigError = (error: Error) => {
  // todo
  console.log(error)
}

export const loadDamConfig = () => {
  return new Promise((resolve, reject) => {
    fetchConfiguration()
      .then((config) => {
        if (Object.keys(config).length < 1) {
          throw new Error('Unable to load env config. Incorrect response body.')
        }
        setDamConfig(config)
        resolve(true)
      })
      .catch((err) => {
        onConfigError(err)
        reject(false)
      })
  })
}
