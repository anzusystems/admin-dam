<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/authorApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import { useAuthorEditActions } from '@/views/dam/author/composables/authorActions'
import { useAuthorValidation } from '@/views/dam/author/composables/authorValidation'
import ABooleanToggle from '@/components/form/ABooleanToggle.vue'
import AValueObjectOptionsSelect from '@/components/form/AValueObjectOptionsSelect.vue'
import { useAuthorType } from '@/model/dam/valueObject/AuthorType'

const { author } = useAuthorEditActions()

const { v$ } = useAuthorValidation(author)

const { t } = useI18n({ useScope: 'global' })

const { authorTypeOptions } = useAuthorType()
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField
            :label="t('coreDam.author.model.name')"
            v-model="author.name"
            :v="v$.author.name"
            data-cy="author-name"
          ></ATextField>
        </ARow>
        <ARow>
          <ATextField
            :label="t('coreDam.author.model.identifier')"
            v-model="author.identifier"
            :v="v$.author.identifier"
            data-cy="author-identifier"
          ></ATextField>
        </ARow>
        <ARow>
          <ABooleanToggle
            :label="t('coreDam.author.model.flags.reviewed')"
            v-model="author.flags.reviewed"
            data-cy="author-flags-reviewed"
          ></ABooleanToggle>
        </ARow>
        <ARow>
          <AValueObjectOptionsSelect
            :label="t('coreDam.author.model.type')"
            v-model="author.type"
            :items="authorTypeOptions"
            data-cy="author-type"
          ></AValueObjectOptionsSelect>
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
