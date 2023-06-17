<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import { ACreateDialog, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createVideoShowEpisode, ENTITY } from '@/services/api/coreDam/videoShowEpisodeApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useVideoShowEpisodeFactory } from '@/model/coreDam/factory/VideoShowEpisodeFactory'
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import { useVideoShowEpisodeValidation } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeValidation'

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
  return await createVideoShowEpisode(videoShowEpisode.value)
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
