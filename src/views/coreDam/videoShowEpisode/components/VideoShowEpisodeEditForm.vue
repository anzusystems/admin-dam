<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/videoShowEpisodeApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useVideoShowEpisodeEditActions } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeActions'
import { useVideoShowEpisodeValidation } from '@/views/coreDam/videoShowEpisode/composables/videoShowEpisodeValidation'

const { videoShowEpisode } = useVideoShowEpisodeEditActions()

const { v$ } = useVideoShowEpisodeValidation(videoShowEpisode)

const { t } = useI18n()
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <AFormTextField
            v-model="videoShowEpisode.texts.title"
            :label="t('coreDam.videoShowEpisode.model.texts.title')"
            :v="v$.videoShowEpisode.texts.title"
          />
        </ARow>
      </VCol>
      <VCol cols="12" md="4">
        <!--        <ARow>-->
        <!--          <ImagePreview v-model="videoShowEpisode.imagePreview" show-actions />-->
        <!--        </ARow>-->
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
