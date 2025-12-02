<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  ADialogToolbar,
  AFormDatetimePicker,
  AFormTextarea,
  ARow,
  ASystemEntityScope,
  type DocId,
  isNull,
  useAlerts,
} from '@anzusystems/common-admin'
import type { VideoShowEpisode } from '@/types/coreDam/VideoShowEpisode'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useVideoShowEpisodeFactory } from '@/model/coreDam/factory/VideoShowEpisodeFactory'
import {
  createVideoShowEpisode,
  ENTITY,
  prepareFormDataVideoShowEpisode,
} from '@/services/api/coreDam/videoShowEpisodeApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { useVideoShowEpisodeValidation } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeValidation'
import { useI18n } from 'vue-i18n'
import VideoShowRemoteAutocomplete from '@/views/coreDam/videoShow/components/VideoShowRemoteAutocomplete.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    dataCy?: string
    assetId: DocId
  }>(),
  {
    dataCy: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: boolean): void
  (e: 'reloadList'): void
}>()
const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue: boolean) {
    emit('update:modelValue', newValue)
  },
})

const { t } = useI18n()
const { currentExtSystemId } = useCurrentExtSystem()
const { showValidationError, showRecordWas, showErrorsDefault } = useAlerts()

const { createDefault } = useVideoShowEpisodeFactory()
const videoShowEpisode = ref<VideoShowEpisode>(createDefault(currentExtSystemId.value))

const saving = ref(false)
const loadingFormData = ref(false)

const { v$ } = useVideoShowEpisodeValidation(videoShowEpisode)

const closeDialog = (reloadList = false) => {
  value.value = false
  if (reloadList) emit('reloadList')
}

const submit = async () => {
  try {
    saving.value = true
    v$.value.$touch()
    if (v$.value.$invalid) {
      showValidationError()
      saving.value = false
      return
    }
    await createVideoShowEpisode(videoShowEpisode.value)
    showRecordWas('created')
    closeDialog(true)
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saving.value = false
  }
}

const loadFormData = async () => {
  if (!videoShowEpisode.value.videoShow) return
  loadingFormData.value = true
  const res = await prepareFormDataVideoShowEpisode(props.assetId, videoShowEpisode.value.videoShow)
  videoShowEpisode.value.texts.title = res.texts.title
  loadingFormData.value = false
}

const videoShowEpisodeVideoShow = computed(() => {
  return videoShowEpisode.value.videoShow
})

watch(videoShowEpisodeVideoShow, (newValue, oldValue) => {
  if (newValue !== oldValue && !isNull(newValue)) {
    loadFormData()
  }
})

onMounted(async () => {
  videoShowEpisode.value.asset = props.assetId
})
</script>

<template>
  <VDialog
    v-model="value"
    :width="500"
  >
    <VCard v-if="value">
      <ADialogToolbar @on-cancel="closeDialog(false)">
        {{ t('coreDam.videoShowEpisode.button.addNewVideoShowEpisode') }}
      </ADialogToolbar>
      <VCardText>
        <ASystemEntityScope
          :system="SYSTEM_CORE_DAM"
          :subject="ENTITY"
        >
          <ARow>
            <VideoShowRemoteAutocomplete
              v-model="videoShowEpisode.videoShow"
              required
              data-cy="field-choose-video-show"
              :label="t('coreDam.videoShowEpisode.model.videoShow')"
            />
          </ARow>
          <div
            v-if="loadingFormData"
            class="d-flex w-100 justify-center align-center pa-2"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </div>
          <template v-if="videoShowEpisode.videoShow && !loadingFormData">
            <ARow>
              <AFormTextarea
                v-model="videoShowEpisode.texts.title"
                data-cy="field-title-episode"
                :label="t('coreDam.videoShowEpisode.model.texts.title')"
                :v="v$.videoShowEpisode.texts.title"
              />
            </ARow>
          </template>
          <ARow>
            <AFormDatetimePicker
              v-model="videoShowEpisode.dates.publicationDate"
              :label="t('coreDam.videoShowEpisode.model.dates.publicationDate')"
            />
          </ARow>
        </ASystemEntityScope>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <ABtnTertiary
          data-cy="button-cancel"
          @click.stop="closeDialog(false)"
        >
          {{ t('common.button.cancel') }}
        </ABtnTertiary>
        <ABtnPrimary
          data-cy="button-add"
          :loading="saving"
          @click.stop="submit"
        >
          {{ t('common.button.add') }}
        </ABtnPrimary>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
