<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DocId } from '@anzusystems/common-admin'
import { ACreateDialog, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createPodcastEpisode, ENTITY } from '@/services/api/coreDam/podcastEpisodeApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { usePodcastEpisodeFactory } from '@/model/coreDam/factory/PodcastEpisodeFactory'
import type { PodcastEpisode } from '@/types/coreDam/PodcastEpisode'
import { usePodcastEpisodeValidation } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeValidation'

const props = withDefaults(
  defineProps<{
    podcastId: DocId
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'onSuccess', data: PodcastEpisode): void
}>()

const { currentExtSystemId } = useCurrentExtSystem()

const { createDefault } = usePodcastEpisodeFactory()
const podcastEpisode = ref<PodcastEpisode>(createDefault(currentExtSystemId.value))
const dialog = ref(false)

const { v$ } = usePodcastEpisodeValidation(podcastEpisode)
const { t } = useI18n()

const onOpen = () => {
  podcastEpisode.value = createDefault(currentExtSystemId.value, props.podcastId)
}

const create = async () => {
  return await createPodcastEpisode(podcastEpisode.value)
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
    @on-close="dialog = false"
  >
    <template #button-title>
      {{ t('coreDam.podcastEpisode.button.create') }}
    </template>
    <template #title>
      {{ t('coreDam.podcastEpisode.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.texts.title"
            :label="t('coreDam.podcastEpisode.model.texts.title')"
            :v="v$.podcastEpisode.texts.title"
            data-cy="episode-title"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.texts.description"
            :label="t('coreDam.podcastEpisode.model.texts.description')"
            :v="v$.podcastEpisode.texts.description"
            data-cy="episode-description"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.seasonNumber"
            :label="t('coreDam.podcastEpisode.model.attributes.seasonNumber')"
            :v="v$.podcastEpisode.attributes.seasonNumber"
            type="number"
            :step="1"
            data-cy="episode-season-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.episodeNumber"
            :label="t('coreDam.podcastEpisode.model.attributes.episodeNumber')"
            :v="v$.podcastEpisode.attributes.episodeNumber"
            type="number"
            :step="1"
            data-cy="episode-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.extUrl"
            :label="t('coreDam.podcastEpisode.model.attributes.extUrl')"
            :v="v$.podcastEpisode.attributes.extUrl"
            data-cy="episode-ext-url"
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
