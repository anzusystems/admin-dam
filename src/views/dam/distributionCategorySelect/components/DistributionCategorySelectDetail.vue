<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { useDistributionCategorySelectOneStore } from '@/stores/dam/distributionCategorySelectStore'

const { distributionCategorySelect } = storeToRefs(useDistributionCategorySelectOneStore())

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.distributionCategorySelect.model.options')">
          <VListItem class="mt-2 pl-0" two-line v-for="option in distributionCategorySelect.options" :key="option.id">
            <VListItemTitle>{{ option.name }}</VListItemTitle>
            <VListItemSubtitle>{{ option.value }}</VListItemSubtitle>
            <v-divider></v-divider>
          </VListItem>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.distributionCategorySelect.model.id')">
          <ACopyText :value="distributionCategorySelect.id"></ACopyText>
        </ARow>
        <AUserAndTimeTrackingFields :data="distributionCategorySelect"></AUserAndTimeTrackingFields>
      </ACard>
    </VCol>
  </VRow>
</template>
