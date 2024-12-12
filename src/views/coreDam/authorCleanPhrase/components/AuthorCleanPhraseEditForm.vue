<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/AuthorCleanPhraseApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, AFormValueObjectOptionsSelect, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useAuthorCleanPhraseEditActions } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import { useAuthorCleanPhraseValidation } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseValidation'
import { useAuthorCleanPhraseTypeTypes } from '@/model/coreDam/valueObject/AuthorCleanPhraseType'
import { useAuthorCleanPhraseModeTypes } from '@/model/coreDam/valueObject/AuthorCleanPhraseMode'
import AuthorRemoteAutocomplete from '@/views/coreDam/author/components/AuthorRemoteAutocomplete.vue'
import AuthorRemoteAutocompleteCachedAuthorChip
  from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'
import AuthorRemoteAutocompleteWithCached
  from '@/views/coreDam/author/components/AuthorRemoteAutocompleteWithCached.vue'

const { authorCleanPhrase } = useAuthorCleanPhraseEditActions()

const { v$ } = useAuthorCleanPhraseValidation(authorCleanPhrase)

const { t } = useI18n()

const { authorCleanPhraseTypeOptions } = useAuthorCleanPhraseTypeTypes()
const { authorCleanPhraseModeOptions } = useAuthorCleanPhraseModeTypes()

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
            v-model="authorCleanPhrase.phrase"
            :label="t('coreDam.authorCleanPhrase.model.phrase')"
            :v="v$.authorCleanPhrase.phrase"
            data-cy="authorCleanPhrase-phrase"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="authorCleanPhrase.type"
            :label="t('coreDam.authorCleanPhrase.model.type')"
            :items="authorCleanPhraseTypeOptions"
            data-cy="authorCleanPhrase-type"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="authorCleanPhrase.mode"
            :label="t('coreDam.authorCleanPhrase.model.mode')"
            :items="authorCleanPhraseModeOptions"
            data-cy="authorCleanPhrase-mode"
          />
        </ARow>
        <ARow>
          <VCol>
            <VSwitch
              v-model="authorCleanPhrase.flags.wordBoundary"
              :label="t('coreDam.authorCleanPhrase.model.flags.wordBoundary')"
              hide-details
              data-cy="authorCleanPhrase-wordBoundary"
            />
          </VCol>
        </ARow>
        <ARow>
          <AFormTextField
            v-model="authorCleanPhrase.position"
            :label="t('coreDam.authorCleanPhrase.model.position')"
            :v="v$.authorCleanPhrase.position"
            type="number"
            :step="1"
            data-cy="authorCleanPhrase-position"
          />
        </ARow>
        <ARow>
          <AuthorRemoteAutocomplete
            v-model="authorCleanPhrase.authorReplacement"
            :label="t('coreDam.authorCleanPhrase.model.authorReplacement')"
            data-cy="authorCleanPhrase-authorReplacement"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
