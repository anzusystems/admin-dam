<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useAuthorCleanPhraseOneStore } from '@/domains/coreDam/authorCleanPhrase/store/authorCleanPhraseStore'
import AuthorRemoteAutocompleteCachedAuthorChip from '@/domains/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'
import AuthorCleanPhraseModeChip from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseModeChip.vue'
import AuthorCleanPhraseTypeChip from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseTypeChip.vue'

const { authorCleanPhrase } = storeToRefs(useAuthorCleanPhraseOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.phrase')"
        :value="authorCleanPhrase.phrase"
      />
      <ARow :title="t('coreDam.authorCleanPhrase.model.authorReplacement')">
        <AuthorRemoteAutocompleteCachedAuthorChip :id="authorCleanPhrase.authorReplacement" />
      </ARow>

      <ARow :title="t('coreDam.authorCleanPhrase.model.type')">
        <AuthorCleanPhraseTypeChip :type="authorCleanPhrase.type" />
      </ARow>
      <ARow :title="t('coreDam.authorCleanPhrase.model.mode')">
        <AuthorCleanPhraseModeChip :mode="authorCleanPhrase.mode" />
      </ARow>
      <ARow :title="t('coreDam.authorCleanPhrase.model.flags.wordBoundary')">
        <ABooleanValue
          chip
          :value="authorCleanPhrase.flags.wordBoundary"
        />
      </ARow>
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.position')"
        :value="authorCleanPhrase.position"
      />
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.authorCleanPhrase.model.id')">
        <ACopyText :value="authorCleanPhrase.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="authorCleanPhrase" />
    </VCol>
  </VRow>
</template>
