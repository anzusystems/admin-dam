<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/AuthorCleanPhraseApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useAuthorCleanPhraseEditActions } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseActions'
import { useAuthorCleanPhraseValidation } from '@/views/coreDam/authorCleanPhrase/composables/authorCleanPhraseValidation'

const { authorCleanPhrase } = useAuthorCleanPhraseEditActions()

const { v$ } = useAuthorCleanPhraseValidation(authorCleanPhrase)

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
            v-model="authorCleanPhrase.phrase"
            :label="t('coreDam.authorCleanPhrase.model.phrase')"
            :v="v$.authorCleanPhrase.phrase"
            data-cy="authorCleanPhrase-phrase"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
