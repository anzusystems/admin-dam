import { ref } from 'vue'
import { isNull, useDamConfigState } from '@anzusystems/common-admin'
import { envConfig } from '@/services/EnvConfigService'

const chunkSize = ref<number | undefined>(undefined)

export function useChunkSizeService() {
  const { damPrvConfig } = useDamConfigState()
  const lastChunkSize = ref(chunkSize.value || damPrvConfig.value.settings.imageChunkConfig.minSize)

  const minUploadTimeThreshold = envConfig.dam.apiTimeout / 5
  const idealUploadTimeThreshold = envConfig.dam.apiTimeout / 4
  const maxUploadTimeThreshold = envConfig.dam.apiTimeout / 2

  const updateChunkSize = (speed: number | null) => {
    if (isNull(speed)) {
      return false
    }

    const expectedChunkUploadSpeed = lastChunkSize.value / speed
    if (expectedChunkUploadSpeed > maxUploadTimeThreshold) {
      lastChunkSize.value = returnFromRange(maxUploadTimeThreshold * speed)
      chunkSize.value = lastChunkSize.value

      return true
    }
    if (expectedChunkUploadSpeed < minUploadTimeThreshold) {
      lastChunkSize.value = returnFromRange(idealUploadTimeThreshold * speed)
      chunkSize.value = lastChunkSize.value

      return true
    }

    return false
  }

  const returnFromRange = (value: number) => {
    if (value > damPrvConfig.value.settings.imageChunkConfig.maxSize) {
      return damPrvConfig.value.settings.imageChunkConfig.maxSize
    }
    if (value < damPrvConfig.value.settings.imageChunkConfig.minSize) {
      return damPrvConfig.value.settings.imageChunkConfig.minSize
    }

    return value
  }

  return {
    lastChunkSize,
    updateChunkSize,
  }
}
