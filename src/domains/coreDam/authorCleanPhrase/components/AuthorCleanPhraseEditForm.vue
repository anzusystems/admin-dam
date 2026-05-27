<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/authorCleanPhrase/api/AuthorCleanPhraseApi'
import { AFormTextField, AFormValueObjectOptionsSelect, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useAuthorCleanPhraseEditActions } from '@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import { useAuthorCleanPhraseValidation } from '@/domains/coreDam/authorCleanPhrase/composables/authorCleanPhraseValidation'
import { useAuthorCleanPhraseTypeTypes } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseType'
import { useAuthorCleanPhraseModeTypes } from '@/domains/coreDam/authorCleanPhrase/valueObject/AuthorCleanPhraseMode'
import AuthorRemoteAutocomplete from '@/domains/coreDam/author/components/AuthorRemoteAutocomplete.vue'

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
