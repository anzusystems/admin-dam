<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import type { DocId } from '@anzusystems/common-admin'
import {
  AFormTextarea,
  AFormTextField,
  ARow,
  ASystemEntityScope,
  isNull,
  useAlerts,
  useErrorHandler,
} from '@anzusystems/common-admin'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { usePodcastEpisodeFactory } from '@/model/coreDam/factory/PodcastEpisodeFactory'
import { createPodcastEpisode, ENTITY, prepareFormDataPodcastEpisode } from '@/services/api/coreDam/podcastEpisodeApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { usePodcastEpisodeValidation } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeValidation'
import { useI18n } from 'vue-i18n'
import PodcastSelect from '@/views/coreDam/podcast/components/PodcastSelect.vue'

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
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { createDefault } = usePodcastEpisodeFactory()
const podcastEpisode = ref<PodcastEpisode>(createDefault(currentExtSystemId.value))

const saving = ref(false)
const loadingFormData = ref(false)

const { v$ } = usePodcastEpisodeValidation(podcastEpisode)

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
    await createPodcastEpisode(podcastEpisode.value)
    showRecordWas('created')
    closeDialog(true)
  } catch (error) {
    handleError(error)
  } finally {
    saving.value = false
  }
}

const loadFormData = async () => {
  if (!podcastEpisode.value.podcast) return
  loadingFormData.value = true
  const res = await prepareFormDataPodcastEpisode(props.assetId, podcastEpisode.value.podcast)
  podcastEpisode.value.texts.title = res.texts.title
  podcastEpisode.value.texts.description = res.texts.description
  podcastEpisode.value.texts.rawDescription = res.texts.rawDescription
  podcastEpisode.value.attributes.episodeNumber = res.attributes.episodeNumber
  podcastEpisode.value.attributes.seasonNumber = res.attributes.seasonNumber
  podcastEpisode.value.attributes.extId = res.attributes.extId
  loadingFormData.value = false
}

const podcastEpisodePodcast = computed(() => {
  return podcastEpisode.value.podcast
})

watch(podcastEpisodePodcast, (newValue, oldValue) => {
  if (newValue !== oldValue && !isNull(newValue)) {
    loadFormData()
  }
})

onMounted(async () => {
  podcastEpisode.value.asset = props.assetId
})
</script>

<template>
  <VDialog v-model="value" persistent no-click-animation :width="500">
    <VCard v-if="value">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('coreDam.podcastEpisode.common.addAssetToNewPodcastEpisode') }}</div>
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
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <PodcastSelect
              v-model="podcastEpisode.podcast"
              required
              :label="t('coreDam.podcastEpisode.model.podcast')"
            />
          </ARow>
          <div v-if="loadingFormData" class="d-flex w-100 justify-center align-center pa-2">
            <VProgressCircular indeterminate color="primary" />
          </div>
          <template v-if="podcastEpisode.podcast && !loadingFormData">
            <ARow>
              <AFormTextarea
                v-model="podcastEpisode.texts.title"
                :label="t('coreDam.podcastEpisode.model.texts.title')"
                :v="v$.podcastEpisode.texts.title"
              />
            </ARow>
            <ARow>
              <AFormTextarea
                v-model="podcastEpisode.texts.description"
                :label="t('coreDam.podcastEpisode.model.texts.description')"
                :v="v$.podcastEpisode.texts.description"
              />
            </ARow>
            <ARow>
              <AFormTextField
                v-model="podcastEpisode.attributes.seasonNumber"
                :label="t('coreDam.podcastEpisode.model.attributes.seasonNumber')"
                :v="v$.podcastEpisode.attributes.seasonNumber"
                type="number"
                :step="1"
              />
            </ARow>
            <ARow>
              <AFormTextField
                v-model="podcastEpisode.attributes.episodeNumber"
                :label="t('coreDam.podcastEpisode.model.attributes.episodeNumber')"
                :v="v$.podcastEpisode.attributes.episodeNumber"
                type="number"
                :step="1"
              />
            </ARow>
          </template>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer />
        <VBtn color="success" :loading="saving" @click.stop="submit">{{ t('common.button.add') }}</VBtn>
        <VBtn text @click.stop="closeDialog(false)">{{ t('common.button.cancel') }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
