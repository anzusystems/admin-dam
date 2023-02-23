<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { ARow } from '@anzusystems/common-admin'
import { ACopyText } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useAuthorOneStore } from '@/stores/dam/authorStore'
import { useAuthorType } from '@/model/dam/valueObject/AuthorType'
import { ABooleanValue } from '@anzusystems/common-admin'

const { author } = storeToRefs(useAuthorOneStore())

const { t } = useI18n()

const { getAuthorTypeOption } = useAuthorType()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ACard loader="detail">
        <ARow :title="t('coreDam.author.model.name')" :value="author.name" />
        <ARow :title="t('coreDam.author.model.identifier')" :value="author.identifier" />
        <ARow :title="t('coreDam.author.model.type')">
          <VChip size="small">{{ getAuthorTypeOption(author.type)?.title }}</VChip>
        </ARow>
      </ACard>
    </VCol>
    <VCol cols="4">
      <ACard loader="detail">
        <ARow :title="t('coreDam.author.model.id')">
          <ACopyText :value="author.id" />
        </ARow>
        <ARow :title="t('coreDam.author.model.flags.reviewed')">
          <ABooleanValue chip :value="author.flags.reviewed" />
        </ARow>
        <AUserAndTimeTrackingFields :data="author" />
      </ACard>
    </VCol>
  </VRow>
</template>
