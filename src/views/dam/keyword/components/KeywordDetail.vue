<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import ABooleanValue from '@/components/common/ABooleanValue.vue'
import { useKeywordOneStore } from '@/stores/dam/keywordStore'

const { keyword } = storeToRefs(useKeywordOneStore())

const { t } = useI18n({ useScope: 'global' })
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
