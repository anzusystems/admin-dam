<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/authorApi'
import { useI18n } from 'vue-i18n'
import {
  AFormBooleanToggle,
  AFormTextField,
  AFormValueObjectOptionsSelect,
  ARow,
  ASystemEntityScope,
} from '@anzusystems/common-admin'
import { useAuthorEditActions } from '@/views/coreDam/author/composables/authorActions'
import { useAuthorValidation } from '@/views/coreDam/author/composables/authorValidation'
import { useAuthorType } from '@/model/coreDam/valueObject/AuthorType'

const { author } = useAuthorEditActions()

const { v$ } = useAuthorValidation(author)

const { t } = useI18n()

const { authorTypeOptions } = useAuthorType()
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
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
          <AFormBooleanToggle
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
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
