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
          <AFormTextField
            v-model="podcast.attributes.webOrderPosition"
            :label="t('coreDam.podcast.model.attributes.webOrderPosition')"
            :v="v$.podcast.attributes.webOrderPosition"
            type="number"
            :step="1"
            data-cy="podcast-web-order-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="podcast.attributes.mobileOrderPosition"
            :label="t('coreDam.podcastEpodcastpisode.model.attributes.mobileOrderPosition')"
            :v="v$.podcast.attributes.mobileOrderPosition"
            type="number"
            :step="1"
            data-cy="podcast-web-order-number"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="podcast.flags.webPublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.podcast.model.flags.webPublicExportEnabled')"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="podcast.flags.mobilePublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.podcast.model.flags.mobilePublicExportEnabled')"
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
          <AFormTextField
            v-model="podcast.attributes.extUrl"
            :label="t('coreDam.podcast.model.attributes.extUrl')"
            :v="v$.podcast.attributes.extUrl"
            data-cy="podcast-ext-url"
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
        <ARow
          :title="t('coreDam.podcast.model.imagePreview')"
          data-cy="select-image-preview"
        >
          <ImagePreview
            v-model="podcast.imagePreview"
            show-actions
          />
        </ARow>
        <ARow
          :title="t('coreDam.podcast.model.altImage')"
          data-cy="select-image-alt"
        >
          <ImagePreview
            v-model="podcast.altImage"
            show-actions
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
