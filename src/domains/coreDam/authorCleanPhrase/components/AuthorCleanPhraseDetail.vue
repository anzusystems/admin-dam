<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AuthorRemoteAutocompleteCachedAuthorChip from '@/domains/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'
import AuthorCleanPhraseModeChip from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseModeChip.vue'
import AuthorCleanPhraseTypeChip from '@/domains/coreDam/authorCleanPhrase/components/AuthorCleanPhraseTypeChip.vue'
import { useAuthorCleanPhraseOneStore } from '@/domains/coreDam/authorCleanPhrase/store/authorCleanPhraseStore'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'

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
      <DamTrackingFields :data="authorCleanPhrase" />
    </VCol>
  </VRow>
</template>
