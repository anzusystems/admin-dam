<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import {
  AFormTextField,
  ARow,
  ASystemEntityScope,
  isUndefined,
  useAlerts,
  useErrorHandler
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createVideoShowEpisode, ENTITY } from '@/services/api/dam/videoShowEpisodeApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useVideoShowEpisodeFactory } from '@/model/dam/factory/VideoShowEpisodeFactory'
import type { VideoShowEpisode } from '@/types/dam/VideoShowEpisode'
import { useVideoShowEpisodeValidation } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeValidation'

const props = withDefaults(
  defineProps<{
    videoShowId: DocId
    disableRedirect?: boolean
    buttonT?: string
    buttonClass?: string
    dataCy?: string
    disabled?: boolean | undefined
  }>(),
  {
    disableRedirect: false,
    buttonT: 'common.button.create',
    buttonClass: 'ml-2',
    dataCy: '',
    disabled: undefined,
  }
)
const emit = defineEmits<{
  (e: 'afterCreate', data: VideoShowEpisode): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = useVideoShowEpisodeFactory()
const videoShowEpisode = ref<VideoShowEpisode>(createDefault(currentExtSystemId.value))
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  videoShowEpisode.value = createDefault(currentExtSystemId.value, props.videoShowId)
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = useVideoShowEpisodeValidation(videoShowEpisode)
const { t } = useI18n()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  try {
    buttonLoading.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      buttonLoading.value = false
      return
    }
    const res = await createVideoShowEpisode(videoShowEpisode.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.VIDEO_SHOW_EPISODE.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    handleError(error)
  } finally {
    buttonLoading.value = false
  }
}
</script>

<template>
  <VBtn
    :class="buttonClass"
    :data-cy="dataCy"
    color="success"
    :disabled="disabled"
    rounded="pill"
    @click.stop="onClick"
  >
    {{ t(buttonT) }}
  </VBtn>
  <VDialog v-model="dialog" persistent>
    <VCard v-if="dialog" width="500" class="mt-0 mr-auto ml-auto" data-cy="create-panel">
      <VCardTitle class="d-flex pr-2">
        <span>{{ t('coreDam.videoShowEpisode.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <AFormTextField
              v-model="videoShowEpisode.texts.title"
              :label="t('coreDam.videoShowEpisode.model.texts.title')"
              :v="v$.videoShowEpisode.texts.title"
              data-cy="episode-title"
            />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" :loading="buttonLoading" data-cy="button-confirm" @click.stop="onConfirm">
          {{ t(buttonT) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
