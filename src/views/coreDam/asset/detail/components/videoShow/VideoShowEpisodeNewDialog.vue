<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import { AFormTextarea, ARow, ASystemEntityScope, isNull, useAlerts } from '@anzusystems/common-admin'
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
    assetId: DocId
  }>(),
  {}
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
    persistent
    no-click-animation
    :width="500"
  >
    <VCard v-if="value">
      <VToolbar
        class="pl-2"
        density="compact"
      >
        <div class="d-block pl-0 w-100">
          <div class="text-h6">
            {{ t('coreDam.videoShowEpisode.button.addNewVideoShowEpisode') }}
          </div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            data-cy="button-close"
            @click.stop="closeDialog(false)"
          />
        </VToolbarItems>
      </VToolbar>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <VContainer
          class="pa-4"
          fluid
        >
          <ARow>
            <VideoShowRemoteAutocomplete
              v-model="videoShowEpisode.videoShow"
              required
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
                :label="t('coreDam.videoShowEpisode.model.texts.title')"
                :v="v$.videoShowEpisode.texts.title"
              />
            </ARow>
          </template>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn
          color="success"
          :loading="saving"
          @click.stop="submit"
        >
          {{ t('common.button.add') }}
        </VBtn>
        <VBtn
          variant="text"
          @click.stop="closeDialog(false)"
        >
          {{ t('common.button.cancel') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
