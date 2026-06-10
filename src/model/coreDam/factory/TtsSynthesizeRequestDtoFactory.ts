import type { TtsSynthesizeRequestDto } from '@/types/coreDam/TtsNarrationRequest'

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
