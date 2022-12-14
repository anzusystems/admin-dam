<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import ABtn from '@/components/common/buttons/ABtn.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createPodcastEpisode, ENTITY } from '@/services/api/dam/podcastEpisodeApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { usePodcastEpisodeFactory } from '@/model/dam/factory/PodcastEpisodeFactory'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import { usePodcastEpisodeValidation } from '@/views/dam/podcastEpisode/composables/podcastEpisodeValidation'
import type { DocId } from '@/types/common'

const props = withDefaults(
  defineProps<{
    podcastId: DocId
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
  (e: 'afterCreate', data: PodcastEpisode): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = usePodcastEpisodeFactory()
const podcastEpisode = ref<PodcastEpisode>(createDefault(currentExtSystemId.value))
const dialog = ref(false)

const onClick = () => {
  podcastEpisode.value = createDefault(currentExtSystemId.value, props.podcastId)
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = usePodcastEpisodeValidation(podcastEpisode)
const { t } = useI18n({ useScope: 'global' })
const { btnDisable, btnEnable, btnLoadingOn, btnReset } = useUiHelper()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const onConfirm = async () => {
  try {
    btnDisable('create')
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      btnEnable('create')
      return
    }
    btnLoadingOn('create')
    const res = await createPodcastEpisode(podcastEpisode.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.PODCAST_EPISODE.DETAIL, params: { id: res.id } })
    }
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('create')
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
        <span>{{ t('coreDam.podcastEpisode.meta.create') }}</span>
        <VSpacer></VSpacer>
        <VBtn
          class="ml-2"
          icon="mdi-close"
          size="small"
          variant="text"
          @click.stop="onCancel"
          data-cy="button-close"
        ></VBtn>
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.texts.title')"
              v-model="podcastEpisode.texts.title"
              :v="v$.podcastEpisode.texts.title"
              data-cy="episode-title"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.texts.description')"
              v-model="podcastEpisode.texts.description"
              :v="v$.podcastEpisode.texts.description"
              data-cy="episode-description"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.attributes.seasonNumber')"
              v-model="podcastEpisode.attributes.seasonNumber"
              :v="v$.podcastEpisode.attributes.seasonNumber"
              type="number"
              :step="1"
              data-cy="episode-season-number"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.attributes.episodeNumber')"
              v-model="podcastEpisode.attributes.episodeNumber"
              :v="v$.podcastEpisode.attributes.episodeNumber"
              type="number"
              :step="1"
              data-cy="episode-number"
            ></ATextField>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <ABtn color="success" @click.stop="onConfirm" btn-helper="create" data-cy="button-confirm">
          {{ t(buttonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
