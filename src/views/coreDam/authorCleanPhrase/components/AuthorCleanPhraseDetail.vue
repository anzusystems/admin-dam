<script lang="ts" setup>
import { ARow } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthorCleanPhraseOneStore } from '@/stores/coreDam/authorCleanPhraseStore'
import AuthorRemoteAutocompleteCachedAuthorChip
  from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'

const { authorCleanPhrase } = storeToRefs(useAuthorCleanPhraseOneStore())

const { t } = useI18n()
const router = useRouter()

</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.phrase')"
        :value="authorCleanPhrase.phrase"
      />
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.authorReplacement')"
      >
        <AuthorRemoteAutocompleteCachedAuthorChip  :id="authorCleanPhrase.authorReplacement"/>
      </ARow>
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.type')"
        :value="authorCleanPhrase.type"
      />
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.mode')"
        :value="authorCleanPhrase.mode"
      />
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.flags.wordBoundary')"
        :value="authorCleanPhrase.flags.wordBoundary"
      />
      <ARow
        :title="t('coreDam.authorCleanPhrase.model.position')"
        :value="authorCleanPhrase.position"
      />
    </VCol>

  </VRow>
</template>
