<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ACreateDialog,
  AFormDatetimePicker,
  AFormTextarea,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { createPodcast, ENTITY } from '@/services/api/coreDam/podcastApi'
import { usePodcastFactory } from '@/model/coreDam/factory/PodcastFactory'
import type { Podcast } from '@/types/coreDam/Podcast'
import { usePodcastValidation } from '@/views/coreDam/podcast/composables/podcastValidation'
import { usePodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import { useCurrentAssetLicence } from '@/composables/system/currentExtSystem'

withDefaults(
  defineProps<{
    buttonClass?: string
    dataCy?: string
  }>(),
  {
    buttonClass: 'ml-2',
    dataCy: '',
  }
)
const emit = defineEmits<{
  (e: 'onSuccess', data: Podcast): void
}>()

const { t } = useI18n()

const dialog = ref(false)

const { currentAssetLicenceId } = useCurrentAssetLicence()

const { createDefault } = usePodcastFactory()
const podcast = ref<Podcast>(createDefault(currentAssetLicenceId.value))

const onOpen = () => {
  podcast.value = createDefault(currentAssetLicenceId.value)
}

const create = async () => {
  return await createPodcast(podcast.value)
}

const { podcastModeOptions } = usePodcastMode()

const { v$ } = usePodcastValidation(podcast)
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
  >
    <template #title>
      {{ t('coreDam.podcast.meta.create') }}
    </template>
    <template #content>
      <ASystemEntityScope
        :system="SYSTEM_CORE_DAM"
        :subject="ENTITY"
      >
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
        <ARow>
          <AFormDatetimePicker
            v-model="podcast.dates.importFrom"
            :label="t('coreDam.podcast.model.dates.importFrom')"
            :v="v$.podcast.dates.importFrom"
            clearable
          />
        </ARow>
      </ASystemEntityScope>
    </template>
  </ACreateDialog>
</template>
