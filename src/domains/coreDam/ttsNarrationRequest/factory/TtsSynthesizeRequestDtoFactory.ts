import type { TtsSynthesizeRequestDto } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'

export function useTtsSynthesizeRequestDtoFactory() {
  const createDefault = (): TtsSynthesizeRequestDto => ({
    text: '',
    title: null,
    voiceFamilySlug: null,
    podcasts: [],
    assetLicence: null,
  })

  return {
    createDefault,
  }
}
