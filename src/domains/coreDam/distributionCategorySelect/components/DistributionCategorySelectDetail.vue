<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useDistributionCategorySelectOneStore } from '@/domains/coreDam/distributionCategorySelect/store/distributionCategorySelectStore'

const { distributionCategorySelect } = storeToRefs(useDistributionCategorySelectOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.distributionCategorySelect.model.options')">
        <VListItem
          v-for="option in distributionCategorySelect.options"
          :key="option.id"
          class="mt-2 pl-0"
          lines="two"
        >
          <VListItemTitle>{{ option.name }}</VListItemTitle>
          <VListItemSubtitle>{{ option.value }}</VListItemSubtitle>
          <VDivider />
        </VListItem>
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.distributionCategorySelect.model.id')">
        <ACopyText :value="distributionCategorySelect.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="distributionCategorySelect" />
    </VCol>
  </VRow>
</template>
