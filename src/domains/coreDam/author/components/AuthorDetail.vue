<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, useDamAuthorType } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AuthorRemoteAutocompleteCachedAuthorChip from '@/domains/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'
import { useAuthorOneStore } from '@/domains/coreDam/author/store/authorStore'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'

const { author } = storeToRefs(useAuthorOneStore())

const { t } = useI18n()

const { getAuthorTypeOption } = useDamAuthorType()
</script>

<template>
  <VRow>
    <VCol cols="8">
      <ARow
        :title="t('coreDam.author.model.name')"
        :value="author.name"
      />
      <ARow
        :title="t('coreDam.author.model.identifier')"
        :value="author.identifier"
      />
      <ARow :title="t('coreDam.author.model.type')">
        <VChip size="small">
          {{ getAuthorTypeOption(author.type)?.title }}
        </VChip>
      </ARow>
      <ARow :title="t('coreDam.author.model.currentAuthors')">
        <AuthorRemoteAutocompleteCachedAuthorChip
          v-for="authorId in author.currentAuthors"
          :id="authorId"
          :key="authorId"
          class="pr-2"
        />
      </ARow>
      <ARow :title="t('coreDam.author.model.childAuthors')">
        <AuthorRemoteAutocompleteCachedAuthorChip
          v-for="authorId in author.childAuthors"
          :id="authorId"
          :key="authorId"
          class="pr-2"
        />
      </ARow>
    </VCol>
    <VCol cols="4">
      <ARow :title="t('coreDam.author.model.id')">
        <ACopyText :value="author.id" />
      </ARow>
      <ARow :title="t('coreDam.author.model.flags.reviewed')">
        <ABooleanValue
          chip
          :value="author.flags.reviewed"
        />
      </ARow>
      <DamTrackingFields :data="author" />
    </VCol>
  </VRow>
</template>
