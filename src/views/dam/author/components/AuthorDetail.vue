<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import { useI18n } from 'vue-i18n'
import ARow from '@/components/common/ARow.vue'
import ACopyText from '@/components/common/ACopyText.vue'
import { storeToRefs } from 'pinia'
import AUserAndTimeTrackingFields from '@/components/common/AUserAndTimeTrackingFields.vue'
import { useAuthorOneStore } from '@/stores/dam/authorStore'
import { useAuthorType } from '@/model/dam/valueObject/AuthorType'
import ABooleanValue from '@/components/common/ABooleanValue.vue'

const { author } = storeToRefs(useAuthorOneStore())

const { t } = useI18n({ useScope: 'global' })

const { getAuthorTypeOption } = useAuthorType()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.author.model.name')" :value="author.name"></ARow>
        <ARow :title="t('coreDam.author.model.identifier')" :value="author.identifier"></ARow>
        <ARow :title="t('coreDam.author.model.type')">
          <VChip size="small">{{ getAuthorTypeOption(author.type)?.title }}</VChip>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.author.model.id')">
          <ACopyText :value="author.id"></ACopyText>
        </ARow>
        <ARow :title="t('coreDam.author.model.flags.reviewed')">
          <ABooleanValue chip :value="author.flags.reviewed"></ABooleanValue>
        </ARow>
        <AUserAndTimeTrackingFields :data="author"></AUserAndTimeTrackingFields>
      </ACard>
    </VCol>
  </VRow>
</template>
