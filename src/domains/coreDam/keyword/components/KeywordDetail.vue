<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { useKeywordOneStore } from '@/domains/coreDam/keyword/store/keywordStore'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'

const { keyword } = storeToRefs(useKeywordOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.keyword.model.name')"
        :value="keyword.name"
      />
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.keyword.model.id')">
        <ACopyText :value="keyword.id" />
      </ARow>
      <ARow :title="t('coreDam.keyword.model.flags.reviewed')">
        <ABooleanValue
          chip
          :value="keyword.flags.reviewed"
        />
      </ARow>
      <DamTrackingFields :data="keyword" />
    </VCol>
  </VRow>
</template>
