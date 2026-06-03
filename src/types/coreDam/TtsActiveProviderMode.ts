export const TtsActiveProviderMode = {
  Elevenlabs: 'elevenlabs',
  GoogleTts: 'google_tts',
  Auto: 'auto',
} as const

export type TtsActiveProviderModeType = (typeof TtsActiveProviderMode)[keyof typeof TtsActiveProviderMode]
