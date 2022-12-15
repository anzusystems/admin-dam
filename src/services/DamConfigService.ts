import type { DamConfig, DamPubConfig } from '@/types/dam/DamConfig'
import { fetchConfiguration, fetchPubConfiguration } from '@/services/api/dam/configurationApi'
import { ref } from 'vue'
import { UserAuthType } from '@/types/dam/DamConfig'

export const damConfigInitialized = ref(false)
export const damPubConfigInitialized = ref(false)

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

export const damPubConfig: DamPubConfig = {
  userAuthType: UserAuthType.JsonCredentials,
}

const setDamPubConfig = (data: DamPubConfig) => {
  try {
    damPubConfig.userAuthType = data.userAuthType

    damPubConfigInitialized.value = true
  } catch (err) {
    throw new Error('Unable to load dam pub config. Incorrect fields in json.')
  }
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
  console.error(error)
}

export const loadDamConfig = () => {
  return new Promise((resolve, reject) => {
    fetchConfiguration()
      .then((config) => {
        if (Object.keys(config).length < 1) {
          throw new Error('Unable to load config. Incorrect response body.')
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

export const loadDamPubConfig = () => {
  return new Promise((resolve, reject) => {
    fetchPubConfiguration()
      .then((config) => {
        if (Object.keys(config).length < 1) {
          throw new Error('Unable to load pub config. Incorrect response body.')
        }
        setDamPubConfig(config)
        resolve(true)
      })
      .catch((err) => {
        onConfigError(err)
        reject(false)
      })
  })
}
