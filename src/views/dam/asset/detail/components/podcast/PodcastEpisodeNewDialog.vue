<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import type { DocId } from '@/types/common'
import type { PodcastEpisode } from '@/types/dam/PodcastEpisode'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { usePodcastEpisodeFactory } from '@/model/dam/factory/PodcastEpisodeFactory'
import { createPodcastEpisode, ENTITY } from '@/services/api/dam/podcastEpisodeApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { usePodcastEpisodeValidation } from '@/views/dam/podcastEpisode/composables/podcastEpisodeValidation'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ARow from '@/components/common/ARow.vue'
import ATextField from '@/components/form/ATextField.vue'
import { useI18n } from 'vue-i18n'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import PodcastSelect from '@/views/dam/podcast/components/PodcastSelect.vue'

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

const { t } = useI18n({ useScope: 'global' })
const { currentExtSystemId } = useCurrentExtSystem()
const { showValidationError, showRecordWas } = useAlerts()
const { handleError } = useErrorHandler()

const { createDefault } = usePodcastEpisodeFactory()
const podcastEpisode = ref<PodcastEpisode>(createDefault(currentExtSystemId.value))

const saving = ref(false)

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

onMounted(async () => {
  podcastEpisode.value.asset = props.assetId
})
</script>

<template>
  <VDialog v-model="value" persistent no-click-animation :width="500">
    <VCard v-if="value">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">Add new podcast episode</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="closeDialog(false)"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
        <VContainer class="pa-4" fluid>
          <ARow>
            <PodcastSelect
              v-model="podcastEpisode.podcast"
              required
              :label="t('coreDam.podcastEpisode.model.podcast')"
            ></PodcastSelect>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.texts.title')"
              v-model="podcastEpisode.texts.title"
              :v="v$.podcastEpisode.texts.title"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.texts.description')"
              v-model="podcastEpisode.texts.description"
              :v="v$.podcastEpisode.texts.description"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.attributes.seasonNumber')"
              v-model="podcastEpisode.attributes.seasonNumber"
              :v="v$.podcastEpisode.attributes.seasonNumber"
              type="number"
              :step="1"
            ></ATextField>
          </ARow>
          <ARow>
            <ATextField
              :label="t('coreDam.podcastEpisode.model.attributes.episodeNumber')"
              v-model="podcastEpisode.attributes.episodeNumber"
              :v="v$.podcastEpisode.attributes.episodeNumber"
              type="number"
              :step="1"
            ></ATextField>
          </ARow>
        </VContainer>
      </ASystemEntityScope>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn color="success" @click.stop="submit" :loading="saving">Add</VBtn>
        <VBtn text @click.stop="closeDialog(false)">Cancel</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
