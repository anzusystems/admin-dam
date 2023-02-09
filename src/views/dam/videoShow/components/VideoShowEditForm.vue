<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/videoShowApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import { useVideoShowEditActions } from '@/views/dam/videoShow/composables/videoShowActions'
import { useVideoShowValidation } from '@/views/dam/videoShow/composables/videoShowValidation'

const { videoShow } = useVideoShowEditActions()

const { v$ } = useVideoShowValidation(videoShow)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField
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
