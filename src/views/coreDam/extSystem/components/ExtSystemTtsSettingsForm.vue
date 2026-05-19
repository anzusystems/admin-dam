<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/extSystemApi'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/composables/auth/auth'
import { useExtSystemEditActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import { useTtsActiveProviderMode } from '@/model/coreDam/valueObject/TtsActiveProviderMode'
import { AActionSaveButton, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import PodcastRemoteAutocomplete from '@/views/coreDam/podcast/components/PodcastRemoteAutocomplete.vue'

const { extSystem, ttsSettingsSaveButtonLoading, onUpdateTtsSettings } = useExtSystemEditActions()

const { valueObjectOptions } = useTtsActiveProviderMode()

const { t } = useI18n()
</script>

<template>
  <Acl :permission="ACL.DAM_EXT_SYSTEM_UPDATE_TTS_SETTINGS">
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
            <VSelect
              v-model="extSystem.ttsSettings.activeProviderMode"
              :label="t('coreDam.extSystem.ttsSettings.activeProviderMode')"
              :items="valueObjectOptions"
              item-title="title"
              item-value="value"
              data-cy="ext-system-tts-active-provider-mode"
            />
          </ARow>
          <ARow>
            <PodcastRemoteAutocomplete
              v-model="extSystem.ttsSettings.autoPodcastId"
              :label="t('coreDam.extSystem.ttsSettings.autoPodcast')"
              clearable
              data-cy="ext-system-tts-auto-podcast"
            />
          </ARow>
          <ARow>
            <PodcastRemoteAutocomplete
              v-model="extSystem.ttsSettings.recommendedPodcastId"
              :label="t('coreDam.extSystem.ttsSettings.recommendedPodcast')"
              clearable
              data-cy="ext-system-tts-recommended-podcast"
            />
          </ARow>
          <ARow>
            <AActionSaveButton
              :loading="ttsSettingsSaveButtonLoading"
              @save-record="onUpdateTtsSettings"
            />
          </ARow>
        </VCol>
      </VRow>
    </ASystemEntityScope>
  </Acl>
</template>
