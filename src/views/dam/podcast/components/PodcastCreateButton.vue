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
import { createPodcast, ENTITY } from '@/services/api/dam/podcastApi'
import { usePodcastFactory } from '@/model/dam/factory/PodcastFactory'
import type { Podcast } from '@/types/dam/Podcast'
import { usePodcastValidation } from '@/views/dam/podcast/composables/podcastValidation'
import AValueObjectOptionsSelect from '@/components/form/AValueObjectOptionsSelect.vue'
import { usePodcastMode } from '@/model/dam/valueObject/PodcastMode'
import { useCurrentAssetLicence } from '@/composables/system/currentLicence'
import ATextarea from '@/components/form/ATextarea.vue'

withDefaults(
  defineProps<{
    buttonT?: string
    buttonClass?: string
    dataCy?: string
    disabled?: boolean | undefined
  }>(),
  {
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
    const res = await createPodcast(podcast.value)
    emit('afterCreate', res)
    showRecordWas('created')
    dialog.value = false
    if (!isUndefined(res.id)) {
      router.push({ name: ROUTE.DAM.PODCAST.DETAIL, params: { id: res.id } })
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
        <span>{{ t('coreDam.podcast.meta.create') }}</span>
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
              :label="t('coreDam.podcast.model.texts.title')"
              v-model="podcast.texts.title"
              :v="v$.podcast.texts.title"
              data-cy="podcast-title"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextarea
              :label="t('coreDam.podcast.model.texts.description')"
              v-model="podcast.texts.description"
              :v="v$.podcast.texts.description"
              data-cy="podcast-description"
            ></ATextarea>
          </ARow>
          <ARow>
            <AValueObjectOptionsSelect
              :label="t('coreDam.podcast.model.attributes.mode')"
              v-model="podcast.attributes.mode"
              :items="podcastModeOptions"
              data-cy="podcast-mode"
            ></AValueObjectOptionsSelect>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcast.model.attributes.rssUrl')"
              v-model="podcast.attributes.rssUrl"
              :v="v$.podcast.attributes.rssUrl"
              data-cy="podcast-rss-url"
            ></ATextField>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="secondary" variant="text" @click.stop="onCancel" data-cy="button-cancel">
          {{ t('common.button.cancel') }}
        </VBtn>
        <ABtn color="success" @click.stop="onConfirm" btn-helper="create" data-cy="button-create-podcast">
          {{ t(buttonT) }}
        </ABtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
