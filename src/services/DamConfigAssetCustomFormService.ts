import { ref } from 'vue'
import type {
  DamConfigAssetCustomFormElement,
  DamConfigAssetCustomFormElementTemp
} from '@/types/coreDam/DamConfigAssetCustomForm'
import { fetchAssetCustomFormElements } from '@/services/api/coreDam/assetCustomFormApi'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { mapElementsWithKeyToProperty } from '@/services/TempMapCustomFormElementHelper'

export const damConfigAssetCustomFormElementsInitialized = ref(false)

export const damConfigAssetCustomFormElements: {
  [key in AssetType]: DamConfigAssetCustomFormElement[]
} = {
  image: [],
  audio: [],
  video: [],
  document: [],
}

const setDamConfigAssetCustomFormElements = (responses: Awaited<{ data: DamConfigAssetCustomFormElementTemp[] }>[]) => {
  try {
    damConfigAssetCustomFormElements.image = mapElementsWithKeyToProperty(responses[0].data)
    damConfigAssetCustomFormElements.audio = mapElementsWithKeyToProperty(responses[1].data)
    damConfigAssetCustomFormElements.video = mapElementsWithKeyToProperty(responses[2].data)
    damConfigAssetCustomFormElements.document = mapElementsWithKeyToProperty(responses[3].data)

    damConfigAssetCustomFormElementsInitialized.value = true
  } catch (err) {
    throw new Error('Unable to load asset custom form config. Incorrect fields in json.')
  }
}

const onConfigError = (error: Error) => {
  // todo
  console.error(error)
}

export const loadDamConfigAssetCustomFormElements = () => {
  return new Promise((resolve, reject) => {
    const { currentExtSystemId } = useCurrentExtSystem()
    const promises = [
      fetchAssetCustomFormElements(currentExtSystemId.value, AssetType.Image),
      fetchAssetCustomFormElements(currentExtSystemId.value, AssetType.Audio),
      fetchAssetCustomFormElements(currentExtSystemId.value, AssetType.Video),
      fetchAssetCustomFormElements(currentExtSystemId.value, AssetType.Document),
    ]

    Promise.all(promises)
      .then((responses) => {
        if (
          responses.length !== 4 ||
          Object.keys(responses[0]).length < 1 ||
          Object.keys(responses[1]).length < 1 ||
          Object.keys(responses[2]).length < 1 ||
          Object.keys(responses[3]).length < 1
        ) {
          throw new Error('Unable to load asset custom form config. Incorrect response body.')
        }
        setDamConfigAssetCustomFormElements(responses)
        resolve(true)
      })
      .catch((err) => {
        onConfigError(err)
        reject(false)
      })
  })
}
