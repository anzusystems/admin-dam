<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { useDistributionCategoryOneStore } from '@/stores/dam/distributionCategoryStore'

const { distributionCategory, distributionCategorySelectedOptions } = storeToRefs(useDistributionCategoryOneStore())
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.distributionCategory.model.name')" :value="distributionCategory.name" />
        <ARow
          v-for="(option, serviceName) in distributionCategorySelectedOptions"
          :key="serviceName"
          :title="serviceName + ''"
        >
          <VChip size="small">{{ option?.name ?? '-' }}</VChip>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.distributionCategory.model.id')">
          <ACopyText :value="distributionCategory.id" />
        </ARow>
        <AUserAndTimeTrackingFields :data="distributionCategory" />
      </ACard>
    </VCol>
  </VRow>
</template>
