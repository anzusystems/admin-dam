<script lang="ts" setup>
import { ACopyText, ARow } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { useDistributionCategoryOneStore } from '@/domains/coreDam/distributionCategory/store/distributionCategoryStore'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'

const { distributionCategory, distributionCategorySelectedOptions } = storeToRefs(useDistributionCategoryOneStore())
const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.distributionCategory.model.name')"
        :value="distributionCategory.name"
      />
      <ARow
        v-for="(option, serviceName) in distributionCategorySelectedOptions"
        :key="serviceName"
        :title="serviceName + ''"
      >
        <VChip size="small">
          {{ option?.name ?? '-' }}
        </VChip>
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.distributionCategory.model.id')">
        <ACopyText :value="distributionCategory.id" />
      </ARow>
      <DamTrackingFields :data="distributionCategory" />
    </VCol>
  </VRow>
</template>
