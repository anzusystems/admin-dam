<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDistributionCategoryOneStore } from '@/stores/coreDam/distributionCategoryStore'

const { distributionCategory, distributionCategorySelectedOptions } = storeToRefs(useDistributionCategoryOneStore())
const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.distributionCategory.model.name')" :value="distributionCategory.name" />
      <ARow
        v-for="(option, serviceName) in distributionCategorySelectedOptions"
        :key="serviceName"
        :title="serviceName + ''"
      >
        <VChip size="small">{{ option?.name ?? '-' }}</VChip>
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.distributionCategory.model.id')">
        <ACopyText :value="distributionCategory.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="distributionCategory" />
    </VCol>
  </VRow>
</template>
