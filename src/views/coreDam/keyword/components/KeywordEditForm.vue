<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/keywordApi'
import { useI18n } from 'vue-i18n'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import { useKeywordEditActions } from '@/views/coreDam/keyword/composables/keywordActions'
import { useKeywordValidation } from '@/views/coreDam/keyword/composables/keywordValidation'

const { keyword } = useKeywordEditActions()

const { v$ } = useKeywordValidation(keyword)

const { t } = useI18n()
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
            v-model="keyword.name"
            :label="t('coreDam.keyword.model.name')"
            :v="v$.keyword.name"
            data-cy="keyword-name"
          />
        </ARow>
        <ARow>
          <VSwitch
            v-model="keyword.flags.reviewed"
            :label="t('coreDam.keyword.model.flags.reviewed')"
            data-cy="keyword-flags-reviewed"
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
