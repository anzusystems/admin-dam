<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/videoShowApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useVideoShowEditActions } from '@/views/coreDam/videoShow/composables/videoShowActions'
import { useVideoShowValidation } from '@/views/coreDam/videoShow/composables/videoShowValidation'

const { videoShow } = useVideoShowEditActions()

const { v$ } = useVideoShowValidation(videoShow)

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
            v-model="videoShow.texts.title"
            :label="t('coreDam.videoShow.model.texts.title')"
            :v="v$.videoShow.texts.title"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="videoShow.attributes.webOrderPosition"
            :label="t('coreDam.videoShow.model.attributes.webOrderPosition')"
            type="number"
            :step="1"
            data-cy="videoShow-web-order-number"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="videoShow.attributes.mobileOrderPosition"
            :label="t('coreDam.videoShowEvideoShowpisode.model.attributes.mobileOrderPosition')"
            type="number"
            :step="1"
            data-cy="videoShow-web-order-number"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="videoShow.flags.webPublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.videoShow.model.flags.webPublicExportEnabled')"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="videoShow.flags.mobilePublicExportEnabled"
            class="pl-2"
            :label="t('coreDam.videoShow.model.flags.mobilePublicExportEnabled')"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
