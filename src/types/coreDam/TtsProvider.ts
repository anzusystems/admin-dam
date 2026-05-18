export const TtsProvider = {
  Elevenlabs: 'elevenlabs',
  GoogleTts: 'google_tts',
} as const

export type TtsProvider = (typeof TtsProvider)[keyof typeof TtsProvider]
