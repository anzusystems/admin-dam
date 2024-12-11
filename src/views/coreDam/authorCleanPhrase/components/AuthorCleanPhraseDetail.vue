<script lang="ts" setup>
import { ARow } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthorCleanPhraseOneStore } from '@/stores/coreDam/authorCleanPhraseStore'

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
    </VCol>
  </VRow>
</template>
