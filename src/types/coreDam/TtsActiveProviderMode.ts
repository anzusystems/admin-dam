export const TtsActiveProviderMode = {
  Elevenlabs: 'elevenlabs',
  GoogleTts: 'google_tts',
  Auto: 'auto',
} as const

export type TtsActiveProviderMode = (typeof TtsActiveProviderMode)[keyof typeof TtsActiveProviderMode]
