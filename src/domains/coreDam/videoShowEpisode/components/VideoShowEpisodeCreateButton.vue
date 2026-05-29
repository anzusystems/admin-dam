<script lang="ts" setup>
import { ACreateDialog, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY, useCreateVideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/api/videoShowEpisodeApi'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useVideoShowEpisodeFactory } from '@/domains/coreDam/videoShowEpisode/factory/VideoShowEpisodeFactory'
import type { VideoShowEpisode } from '@/domains/coreDam/videoShowEpisode/types/VideoShowEpisode'
import { useVideoShowEpisodeValidation } from '@/domains/coreDam/videoShowEpisode/composables/videoShowEpisodeValidation'

const props = withDefaults(
  defineProps<{
    videoShowId: DocId
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'onSuccess', data: VideoShowEpisode): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = useVideoShowEpisodeFactory()
const videoShowEpisode = ref<VideoShowEpisode>(createDefault(currentExtSystemId.value))
const dialog = ref(false)

const { v$ } = useVideoShowEpisodeValidation(videoShowEpisode)
const { t } = useI18n()

const onOpen = () => {
  videoShowEpisode.value = createDefault(currentExtSystemId.value, props.videoShowId)
}

const create = async () => {
  const { executeRequest } = useCreateVideoShowEpisode()
  return await executeRequest({ object: videoShowEpisode.value })
}
</script>

<template>
  <ACreateDialog
    v-model="dialog"
    :v="v$"
    :call-create="create"
    disable-redirect
    :button-class="buttonClass"
    :data-cy="dataCy"
    :max-width="500"
    @on-open="onOpen"
    @on-success="emit('onSuccess', $event)"
    @on-close="dialog = false"
  >
    <template #button-title>
      {{ t('coreDam.videoShowEpisode.button.create') }}
    </template>
    <template #title>
      {{ t('coreDam.videoShowEpisode.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="videoShowEpisode.texts.title"
            :label="t('coreDam.videoShowEpisode.model.texts.title')"
            :v="v$.videoShowEpisode.texts.title"
            data-cy="episode-title"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
