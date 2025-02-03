<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/videoShowEpisodeApi'
import { useI18n } from 'vue-i18n'
import { AFormDatetimePicker, AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useVideoShowEpisodeEditActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import { useVideoShowEpisodeValidation } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeValidation'

const { videoShowEpisode } = useVideoShowEpisodeEditActions()

const { v$ } = useVideoShowEpisodeValidation(videoShowEpisode)

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
            v-model="videoShowEpisode.texts.title"
            :label="t('coreDam.videoShowEpisode.model.texts.title')"
            :v="v$.videoShowEpisode.texts.title"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="videoShowEpisode.attributes.webOrderPosition"
            :label="t('coreDam.videoShowEpisode.model.attributes.webOrderPosition')"
            type="number"
            :step="1"
            data-cy="videoShowEpisode-web-order-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="videoShowEpisode.attributes.mobileOrderPosition"
            :label="t('coreDam.videoShowEpisode.model.attributes.mobileOrderPosition')"
            type="number"
            :step="1"
            data-cy="videoShowEpisode-web-order-number"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="videoShowEpisode.flags.webPublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.videoShowEpisode.model.flags.webPublicExportEnabled')"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="videoShowEpisode.flags.mobilePublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.videoShowEpisode.model.flags.mobilePublicExportEnabled')"
          />
        </ARow>
        <ARow>
          <AFormDatetimePicker
            v-model="videoShowEpisode.dates.publicationDate"
            :label="t('coreDam.videoShowEpisode.model.dates.publicationDate')"
          />
        </ARow>
      </VCol>
      <VCol
        cols="12"
        md="4"
      />
    </VRow>
  </ASystemEntityScope>
</template>
