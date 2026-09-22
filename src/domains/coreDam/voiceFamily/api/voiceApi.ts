import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { Voice, VoiceDiscriminatorType } from '@/domains/coreDam/voiceFamily/types/Voice'
import { RESOURCE_VOICE, VoiceDiscriminator } from '@/domains/coreDam/voiceFamily/types/Voice'

const END_POINT_FAMILY = '/adm/v1/voice/voice-family'
const END_POINT = '/adm/v1/voice'
export const ENTITY = RESOURCE_VOICE

// Writes are split per discriminator (separate backend controllers); reads/delete stay on the unified endpoint.
export const writeEndpoint = (discriminator: VoiceDiscriminatorType): string => {
  switch (discriminator) {
    case VoiceDiscriminator.Elevenlabs:
      return '/adm/v1/voice-elevenlabs'
    case VoiceDiscriminator.GoogleTts:
      return '/adm/v1/voice-google-tts'
  }
  throw new Error(`Unknown VoiceDiscriminator: ${discriminator as string}`)
}

export const useFetchVoiceListByFamily = () =>
  useApiFetchList<Voice[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_FAMILY + '/:voiceFamilyId',
  })

export const useCreateVoice = () =>
  useApiRequest<Voice, Voice>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateVoice = () =>
  useApiRequest<Voice, Voice>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteVoice = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
