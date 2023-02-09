<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/videoShowEpisodeApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import { useVideoShowEpisodeEditActions } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeActions'
import { useVideoShowEpisodeValidation } from '@/views/dam/videoShowEpisode/composables/videoShowEpisodeValidation'

const { videoShowEpisode } = useVideoShowEpisodeEditActions()

const { v$ } = useVideoShowEpisodeValidation(videoShowEpisode)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField
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
