<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/voiceFamily/api/voiceFamilyApi'
import { useI18n } from 'vue-i18n'
import {
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { AFormRemoteAutocomplete, FilterInnerConfigKey, FilterInnerDataKey } from '@anzusystems/common-admin/labs'
import { useVoiceFamilyEditActions } from '@/domains/coreDam/voiceFamily/composables/voiceFamilyActions'
import { useVoiceFamilyValidation } from '@/domains/coreDam/voiceFamily/composables/voiceFamilyValidation'
import { useVoiceDiscriminator } from '@/domains/coreDam/voiceFamily/valueObject/VoiceDiscriminator'
import { useLanguage } from '@/domains/coreDam/voiceFamily/valueObject/Language'
import { useKeywordSelectActions } from '@/domains/coreDam/keyword/composables/keywordActions'
import { useKeywordInnerFilter } from '@/domains/coreDam/keyword/filter/KeywordFilter'

const { voiceFamily } = useVoiceFamilyEditActions()

const { v$ } = useVoiceFamilyValidation(voiceFamily)
const { valueObjectOptionsNullable: ttsProviderOptionsNullable } = useVoiceDiscriminator()
const { valueObjectOptions: languageOptions } = useLanguage()
const { fetchItems: fetchKeywordItems, fetchItemsByIds: fetchKeywordItemsByIds } = useKeywordSelectActions()
const { filterConfig: keywordFilterConfig, filterData: keywordFilterData } = useKeywordInnerFilter()
provide(FilterInnerConfigKey, keywordFilterConfig)
provide(FilterInnerDataKey, keywordFilterData)
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
            v-model="voiceFamily.slug"
            :label="t('coreDam.voiceFamily.model.slug')"
            :v="v$.voiceFamily.slug"
            disabled
            data-cy="voice-family-slug"
          />
        </ARow>
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
          <AFormValueObjectOptionsSelect
            v-model="voiceFamily.language"
            :label="t('coreDam.voiceFamily.model.language')"
            :items="languageOptions"
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
            v-model="voiceFamily.keywords"
            :label="t('coreDam.voiceFamily.model.keywords')"
            :fetch-items="fetchKeywordItems"
            :fetch-items-by-ids="fetchKeywordItemsByIds"
            multiple
            clearable
            filter-by-field="text"
            min-search-text="common.damImage.keyword.filterMinChars"
            data-cy="voice-family-keywords"
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
