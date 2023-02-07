<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/keywordApi'
import { useI18n } from 'vue-i18n'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import ABooleanToggle from '@/components/form/ABooleanToggle.vue'
import { useKeywordEditActions } from '@/views/dam/keyword/composables/keywordActions'
import { useKeywordValidation } from '@/views/dam/keyword/composables/keywordValidation'

const { keyword } = useKeywordEditActions()

const { v$ } = useKeywordValidation(keyword)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField
            v-model="keyword.name"
            :label="t('coreDam.keyword.model.name')"
            :v="v$.keyword.name"
            data-cy="keyword-name"
          />
        </ARow>
        <ARow>
          <ABooleanToggle
            v-model="keyword.flags.reviewed"
            :label="t('coreDam.keyword.model.flags.reviewed')"
            data-cy="keyword-flags-reviewed"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
