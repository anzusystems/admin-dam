<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  AFormTextarea,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  isUndefined,
  useAlerts,
  useErrorHandler,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createPodcast, ENTITY } from '@/services/api/coreDam/podcastApi'
import { usePodcastFactory } from '@/model/coreDam/factory/PodcastFactory'
import type { Podcast } from '@/types/coreDam/Podcast'
import { usePodcastValidation } from '@/views/coreDam/podcast/composables/podcastValidation'
import { usePodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'
import { ROUTE } from '@/router/routes'
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
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
  (e: 'afterCreate', data: Podcast): void
}>()

const { currentAssetLicenceId } = useCurrentAssetLicence()

const { createDefault } = usePodcastFactory()
const podcast = ref<Podcast>(createDefault(currentAssetLicenceId.value))
const dialog = ref(false)
const buttonLoading = ref(false)

const onClick = () => {
  podcast.value = createDefault(currentAssetLicenceId.value)
  dialog.value = true
}

const onCancel = () => {
  dialog.value = false
}

const { podcastModeOptions } = usePodcastMode()

const router = useRouter()
const { v$ } = usePodcastValidation(podcast)
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
    const res = await createPodcast(podcast.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id) && !props.disableRedirect) {
      router.push({ name: ROUTE.DAM.PODCAST.DETAIL, params: { id: res.id } })
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
        <span>{{ t('coreDam.podcast.meta.create') }}</span>
        <VSpacer />
        <VBtn class="ml-2" icon="mdi-close" size="small" variant="text" data-cy="button-close" @click.stop="onCancel" />
      </VCardTitle>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <AFormTextField
              v-model="podcast.texts.title"
              :label="t('coreDam.podcast.model.texts.title')"
              :v="v$.podcast.texts.title"
              data-cy="podcast-title"
            />
          </ARow>
          <ARow>
            <AFormTextarea
              v-model="podcast.texts.description"
              :label="t('coreDam.podcast.model.texts.description')"
              :v="v$.podcast.texts.description"
              data-cy="podcast-description"
            />
          </ARow>
          <ARow>
            <AFormValueObjectOptionsSelect
              v-model="podcast.attributes.mode"
              :label="t('coreDam.podcast.model.attributes.mode')"
              :items="podcastModeOptions"
              data-cy="podcast-mode"
            />
          </ARow>
          <ARow>
            <AFormTextField
              v-model="podcast.attributes.rssUrl"
              :label="t('coreDam.podcast.model.attributes.rssUrl')"
              :v="v$.podcast.attributes.rssUrl"
              data-cy="podcast-rss-url"
            />
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="secondary" variant="text" data-cy="button-cancel" @click.stop="onCancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <VBtn color="success" :loading="buttonLoading" data-cy="button-create-podcast" @click.stop="onConfirm">
          {{ t(buttonT) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>