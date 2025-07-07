<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/podcastEpisodeApi'
import { useI18n } from 'vue-i18n'
import { AFormDatetimePicker, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { usePodcastEpisodeEditActions } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeActions'
import { usePodcastEpisodeValidation } from '@/views/coreDam/podcastEpisode/composables/podcastEpisodeValidation'
import ImagePreview from '@/views/coreDam/asset/components/ImagePreview.vue'

const { podcastEpisode } = usePodcastEpisodeEditActions()

const { v$ } = usePodcastEpisodeValidation(podcastEpisode)

const { t } = useI18n()
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
            v-model="podcastEpisode.texts.title"
            :label="t('coreDam.podcastEpisode.model.texts.title')"
            :v="v$.podcastEpisode.texts.title"
            data-cy="episode-title"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.webOrderPosition"
            :label="t('coreDam.podcastEpisode.model.attributes.webOrderPosition')"
            :v="v$.podcastEpisode.attributes.webOrderPosition"
            type="number"
            :step="1"
            data-cy="episode-web-order-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.mobileOrderPosition"
            :label="t('coreDam.podcastEpisode.model.attributes.mobileOrderPosition')"
            :v="v$.podcastEpisode.attributes.mobileOrderPosition"
            type="number"
            :step="1"
            data-cy="episode-web-order-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.duration"
            :label="t('coreDam.podcastEpisode.model.attributes.duration')"
            :v="v$.podcastEpisode.attributes.duration"
            type="number"
            :step="1"
            data-cy="episode-duration"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="podcastEpisode.flags.webPublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.podcastEpisode.model.flags.webPublicExportEnabled')"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="podcastEpisode.flags.mobilePublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.podcastEpisode.model.flags.mobilePublicExportEnabled')"
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
            v-model="podcastEpisode.attributes.extId"
            :label="t('coreDam.podcastEpisode.model.attributes.extId')"
            :v="v$.podcastEpisode.attributes.extId"
            data-cy="episode-ext-id"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.extUrl"
            :label="t('coreDam.podcastEpisode.model.attributes.extUrl')"
            :v="v$.podcastEpisode.attributes.extUrl"
            data-cy="podcast-ext-url"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcastEpisode.attributes.rssUrl"
            :label="t('coreDam.podcastEpisode.model.attributes.rssUrl')"
            :v="v$.podcastEpisode.attributes.rssUrl"
            data-cy="podcast-ext-rssUrl"
          />
        </ARow>
        <ARow>
          <AFormDatetimePicker
            v-model="podcastEpisode.dates.publicationDate"
            :label="t('coreDam.podcastEpisode.model.dates.publicationDate')"
          />
        </ARow>
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <ARow>
          <ImagePreview
            v-model="podcastEpisode.imagePreview"
            show-actions
            data-cy="select-image-preview"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
