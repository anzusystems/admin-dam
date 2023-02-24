<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/videoShowApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useVideoShowEditActions } from '@/views/dam/videoShow/composables/videoShowActions'
import { useVideoShowValidation } from '@/views/dam/videoShow/composables/videoShowValidation'

const { videoShow } = useVideoShowEditActions()

const { v$ } = useVideoShowValidation(videoShow)

const { t } = useI18n()
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <AFormTextField
            v-model="videoShow.texts.title"
            :label="t('coreDam.videoShow.model.texts.title')"
            :v="v$.videoShow.texts.title"
          />
        </ARow>
        <!--        <ARow>-->
        <!--          <ImagePreview v-model="videoShow.imagePreview" show-actions />-->
        <!--        </ARow>-->
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
