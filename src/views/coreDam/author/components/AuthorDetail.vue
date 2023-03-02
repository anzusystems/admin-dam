<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAuthorOneStore } from '@/stores/coreDam/authorStore'
import { useAuthorType } from '@/model/coreDam/valueObject/AuthorType'

const { author } = storeToRefs(useAuthorOneStore())

const { t } = useI18n()

const { getAuthorTypeOption } = useAuthorType()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow :title="t('coreDam.author.model.name')" :value="author.name" />
      <ARow :title="t('coreDam.author.model.identifier')" :value="author.identifier" />
      <ARow :title="t('coreDam.author.model.type')">
        <VChip size="small">{{ getAuthorTypeOption(author.type)?.title }}</VChip>
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.author.model.id')">
        <ACopyText :value="author.id" />
      </ARow>
      <ARow :title="t('coreDam.author.model.flags.reviewed')">
        <ABooleanValue chip :value="author.flags.reviewed" />
      </ARow>
      <AUserAndTimeTrackingFields :data="author" />
    </VCol>
  </VRow>
</template>
