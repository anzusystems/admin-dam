<script lang="ts" setup>
import { ABooleanValue, ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAuthorOneStore } from '@/stores/coreDam/authorStore'
import { useDamAuthorType } from '@anzusystems/common-admin'
import AuthorRemoteAutocompleteCachedAuthorChip from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'

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
          class="pr-2"
          v-for="authorId in author.currentAuthors"
          :key="authorId"
          :id="authorId"
        />
      </ARow>
      <ARow :title="t('coreDam.author.model.childAuthors')">
        <AuthorRemoteAutocompleteCachedAuthorChip
          class="pr-2"
          v-for="authorId in author.childAuthors"
          :key="authorId"
          :id="authorId"
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
      <AUserAndTimeTrackingFields :data="author" />
    </VCol>
  </VRow>
</template>
