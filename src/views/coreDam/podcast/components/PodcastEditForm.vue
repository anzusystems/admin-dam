<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/podcastApi'
import { useI18n } from 'vue-i18n'
import {
  AFormDatetimePicker,
  AFormTextarea,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { usePodcastEditActions } from '@/views/coreDam/podcast/composables/podcastActions'
import { usePodcastValidation } from '@/views/coreDam/podcast/composables/podcastValidation'
import { usePodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import ImagePreview from '@/views/coreDam/asset/components/ImagePreview.vue'

const { podcast } = usePodcastEditActions()

const { v$ } = usePodcastValidation(podcast)

const { t } = useI18n()

const { podcastModeOptions } = usePodcastMode()
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <ARow>
          <AFormTextField
            v-model="podcast.texts.title"
            :label="t('coreDam.podcast.model.texts.title')"
            :v="v$.podcast.texts.title"
          />
        </ARow>
        <ARow>
          <AFormTextarea
            v-model="podcast.texts.description"
            :label="t('coreDam.podcast.model.texts.description')"
            :v="v$.podcast.texts.description"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="podcast.attributes.mode"
            :label="t('coreDam.podcast.model.attributes.mode')"
            :items="podcastModeOptions"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcast.attributes.rssUrl"
            :label="t('coreDam.podcast.model.attributes.rssUrl')"
            :v="v$.podcast.attributes.rssUrl"
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
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <ARow :title="t('coreDam.podcast.model.imagePreview')">
          <ImagePreview
            v-model="podcast.imagePreview"
            show-actions
          />
        </ARow>
        <ARow :title="t('coreDam.podcast.model.altImage')">
          <ImagePreview
            v-model="podcast.altImage"
            show-actions
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
