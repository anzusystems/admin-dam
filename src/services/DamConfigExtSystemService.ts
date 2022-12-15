import type { DamConfigExtSystem, ExtSystemConfig } from '@/types/dam/DamConfig'
import { fetchExtSystemConfiguration } from '@/services/api/dam/configurationApi'
import { ref } from 'vue'

export const damConfigExtSystemInitialized = ref(false)

/**
 * @param override Supports only a shallow merge and not a deep merge.
 */
const createDefaultExtSystemConfig = (override: Partial<ExtSystemConfig> = {}): ExtSystemConfig => ({
  ...({
    sizeLimit: 0,
    defaultFileVersion: '',
    versions: [],
    mimeTypes: [],
    distribution: {
      distributionServices: [],
      distributionRequirements: {},
    },
    keywords: {
      enabled: false,
      required: false,
    },
    authors: {
      enabled: false,
      required: false,
    },
    customMetadataPinnedAmount: 1,
  } as ExtSystemConfig),
  ...override,
})

export const damConfigExtSystem: DamConfigExtSystem = {
  assetExternalProviders: {},
  audio: createDefaultExtSystemConfig(),
  document: createDefaultExtSystemConfig(),
  image: createDefaultExtSystemConfig(),
  video: createDefaultExtSystemConfig(),
}

const setDamConfigExtSystem = (data: DamConfigExtSystem) => {
  try {
    damConfigExtSystem.assetExternalProviders = data.assetExternalProviders
    damConfigExtSystem.audio = data.audio
    damConfigExtSystem.document = data.document
    damConfigExtSystem.image = data.image
    damConfigExtSystem.video = data.video

    damConfigExtSystemInitialized.value = true
  } catch (err) {
    throw new Error('Unable to load dam ext system config. Incorrect fields in json.')
  }
}

const onConfigError = (error: Error) => {
  // todo
}

export const loadDamConfigExtSystem = () => {
  return new Promise((resolve, reject) => {
    fetchExtSystemConfiguration(1)
      .then((config) => {
        if (Object.keys(config).length < 1) {
          throw new Error('Unable to load dam ext system config. Incorrect response body.')
        }
        setDamConfigExtSystem(config)
        resolve(true)
      })
      .catch((err) => {
        onConfigError(err)
        reject(false)
      })
  })
}
