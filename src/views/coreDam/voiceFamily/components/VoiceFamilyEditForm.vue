<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/voiceFamilyApi'
import { useI18n } from 'vue-i18n'
import {
  AFormRemoteAutocomplete,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { useVoiceFamilyEditActions } from '@/views/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyValidation } from '@/views/coreDam/voiceFamily/composables/voiceFamilyValidation'
import { useTtsProvider } from '@/model/coreDam/valueObject/TtsProvider'
import { useKeywordSelectActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordFilter } from '@/model/coreDam/filter/KeywordFilter'

const { voiceFamily } = useVoiceFamilyEditActions()

const { v$ } = useVoiceFamilyValidation(voiceFamily)
const { ttsProviderOptionsNullable } = useTtsProvider()
const { fetchItems: fetchKeywordItems, fetchItemsByIds: fetchKeywordItemsByIds } = useKeywordSelectActions()
const keywordInnerFilter = useKeywordFilter()
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
            v-model="voiceFamily.displayName"
            :label="t('coreDam.voiceFamily.model.displayName')"
            :v="v$.voiceFamily.displayName"
            required
            data-cy="voice-family-display-name"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="voiceFamily.language"
            :label="t('coreDam.voiceFamily.model.language')"
            :v="v$.voiceFamily.language"
            required
            data-cy="voice-family-language"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="voiceFamily.preferredProvider"
            :label="t('coreDam.voiceFamily.model.preferredProvider')"
            :items="ttsProviderOptionsNullable"
            data-cy="voice-family-preferred-provider"
          />
        </ARow>
        <ARow>
          <AFormRemoteAutocomplete
            v-model="voiceFamily.keyword"
            :label="t('coreDam.voiceFamily.model.keyword')"
            :fetch-items="fetchKeywordItems"
            :fetch-items-by-ids="fetchKeywordItemsByIds"
            :inner-filter="keywordInnerFilter"
            clearable
            filter-by-field="text"
            data-cy="voice-family-keyword"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="voiceFamily.active"
            class="pl-2"
            :label="t('coreDam.voiceFamily.model.active')"
            hide-details
            data-cy="voice-family-is-active"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
