<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/authorApi'
import { useI18n } from 'vue-i18n'
import {
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
  useDamAuthorType,
} from '@anzusystems/common-admin'
import { useAuthorEditActions } from '@/views/coreDam/author/composables/authorActions'
import { useAuthorValidation } from '@/views/coreDam/author/composables/authorValidation'
import AuthorRemoteAutocomplete from '@/views/coreDam/author/components/AuthorRemoteAutocomplete.vue'
import AuthorRemoteAutocompleteCachedAuthorChip from '@/views/coreDam/author/components/AuthorRemoteAutocompleteCachedAuthorChip.vue'

const { author } = useAuthorEditActions()
const { v$ } = useAuthorValidation(author)
const { t } = useI18n()

const { authorTypeOptions } = useDamAuthorType()
</script>

<template>
  <ASystemEntityScope
    :system="SYSTEM_CORE_DAM"
    :subject="ENTITY"
  >
    <VRow>
      <VCol
        cols="12"
        md="8"
      >
        <ARow>
          <AFormTextField
            v-model="author.name"
            :label="t('coreDam.author.model.name')"
            :v="v$.author.name"
            data-cy="author-name"
          />
        </ARow>
        <ARow>
          <AFormTextField
            v-model="author.identifier"
            :label="t('coreDam.author.model.identifier')"
            :v="v$.author.identifier"
            data-cy="author-identifier"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="author.flags.reviewed"
            :label="t('coreDam.author.model.flags.reviewed')"
            data-cy="author-flags-reviewed"
          />
        </ARow>
        <ARow>
          <AFormValueObjectOptionsSelect
            v-model="author.type"
            :label="t('coreDam.author.model.type')"
            :items="authorTypeOptions"
            data-cy="author-type"
          />
        </ARow>
        <ARow>
          <AuthorRemoteAutocomplete
            v-model="author.currentAuthors"
            can-be-current-author
            :label="t('coreDam.author.model.currentAuthors')"
            data-cy="authorCleanPhrase-authorReplacement"
            multiple
            clearable
            :disabled="author.childAuthors.length !== 0"
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
    </VRow>
  </ASystemEntityScope>
</template>
