<script lang="ts" setup>
import { ACard, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useDistributionCategorySelectOneStore } from '@/stores/dam/distributionCategorySelectStore'

const { distributionCategorySelect } = storeToRefs(useDistributionCategorySelectOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.distributionCategorySelect.model.options')">
          <VListItem v-for="option in distributionCategorySelect.options" :key="option.id" class="mt-2 pl-0" two-line>
            <VListItemTitle>{{ option.name }}</VListItemTitle>
            <VListItemSubtitle>{{ option.value }}</VListItemSubtitle>
            <VDivider />
          </VListItem>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.distributionCategorySelect.model.id')">
          <ACopyText :value="distributionCategorySelect.id" />
        </ARow>
        <AUserAndTimeTrackingFields :data="distributionCategorySelect" />
      </ACard>
    </VCol>
  </VRow>
</template>
