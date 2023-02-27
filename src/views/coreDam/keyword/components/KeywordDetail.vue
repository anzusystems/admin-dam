<script lang="ts" setup>
import { ABooleanValue, ACard, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useKeywordOneStore } from '@/stores/dam/keywordStore'

const { keyword } = storeToRefs(useKeywordOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.keyword.model.name')" :value="keyword.name" />
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.keyword.model.id')">
          <ACopyText :value="keyword.id" />
        </ARow>
        <ARow :title="t('coreDam.keyword.model.flags.reviewed')">
          <ABooleanValue chip :value="keyword.flags.reviewed" />
        </ARow>
        <AUserAndTimeTrackingFields :data="keyword" />
      </ACard>
    </VCol>
  </VRow>
</template>
