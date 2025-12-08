<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useKeywordOneStore } from '@/stores/coreDam/keywordStore'
import CachedDamUserChip from '@/components/CachedDamUserChip.vue'

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
      <ARow :title="t('coreDam.keyword.model.createdBy')">
        <CachedDamUserChip :id="keyword.createdBy" />
      </ARow>
      <ARow :title="t('coreDam.keyword.model.modifiedBy')">
        <CachedDamUserChip :id="keyword.modifiedBy" />
      </ARow>
      <AUserAndTimeTrackingFields :data="keyword" />
    </VCol>
  </VRow>
</template>
