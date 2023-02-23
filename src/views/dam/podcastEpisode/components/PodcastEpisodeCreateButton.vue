<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import { useAlerts } from '@anzusystems/common-admin'
import { useErrorHandler } from '@/composables/system/error'
import { isUndefined } from '@/utils/common'
import { ROUTE } from '@/router/routes'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createPodcastEpisode, ENTITY } from '@/services/api/dam/podcastEpisodeApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { usePodcastEpisodeFactory } from '@/model/dam/factory/PodcastEpisodeFactory'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import { usePodcastEpisodeValidation } from '@/views/dam/podcastEpisode/composables/podcastEpisodeValidation'

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
const buttonLoading = ref(false)

const onClick = () => {
  podcastEpisode.value = createDefault(currentExtSystemId.value, props.podcastId)
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const router = useRouter()
const { v$ } = usePodcastEpisodeValidation(podcastEpisode)
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
        <span>{{ t('coreDam.podcastEpisode.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <ATextField
              v-model="podcastEpisode.texts.title"
              :label="t('coreDam.podcastEpisode.model.texts.title')"
              :v="v$.podcastEpisode.texts.title"
              data-cy="episode-title"
            />
          </ARow>
          <ARow>
            <ATextField
              v-model="podcastEpisode.texts.description"
              :label="t('coreDam.podcastEpisode.model.texts.description')"
              :v="v$.podcastEpisode.texts.description"
              data-cy="episode-description"
            />
          </ARow>
          <ARow>
            <ATextField
              v-model="podcastEpisode.attributes.seasonNumber"
              :label="t('coreDam.podcastEpisode.model.attributes.seasonNumber')"
              :v="v$.podcastEpisode.attributes.seasonNumber"
              type="number"
              :step="1"
              data-cy="episode-season-number"
            />
          </ARow>
          <ARow>
            <ATextField
              v-model="podcastEpisode.attributes.episodeNumber"
              :label="t('coreDam.podcastEpisode.model.attributes.episodeNumber')"
              :v="v$.podcastEpisode.attributes.episodeNumber"
              type="number"
              :step="1"
              data-cy="episode-number"
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
