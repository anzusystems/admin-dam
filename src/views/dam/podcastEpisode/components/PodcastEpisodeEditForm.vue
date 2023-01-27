<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/podcastEpisodeApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import { usePodcastEpisodeEditActions } from '@/views/dam/podcastEpisode/composables/podcastEpisodeActions'
import { usePodcastEpisodeValidation } from '@/views/dam/podcastEpisode/composables/podcastEpisodeValidation'
import ADatetimePicker from '@/components/common/ADatetimePicker.vue'
import ImagePreview from '@/views/dam/asset/components/ImagePreview.vue'

const { podcastEpisode } = usePodcastEpisodeEditActions()

const { v$ } = usePodcastEpisodeValidation(podcastEpisode)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
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
        <ARow>
          <ATextField
            :label="t('coreDam.podcastEpisode.model.attributes.extId')"
            v-model="podcastEpisode.attributes.extId"
            :v="v$.podcastEpisode.attributes.extId"
          ></ATextField>
        </ARow>
        <ARow>
          <ADatetimePicker
            :label="t('coreDam.podcastEpisode.model.dates.publicationDate')"
            v-model="podcastEpisode.dates.publicationDate"
          ></ADatetimePicker>
        </ARow>
      </VCol>
      <VCol cols="12" md="4">
        <ARow>
          <ImagePreview v-model="podcastEpisode.imagePreview" show-actions />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
