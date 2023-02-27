<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/extSystemApi'
import { useI18n } from 'vue-i18n'
import { useExtSystemEditActions } from '@/views/coreDam/extSystem/composables/extSystemActions'
import { useExtSystemValidation } from '@/views/coreDam/extSystem/composables/extSystemValidation'
import { AFormTextField, ARow, ASystemEntityScope } from '@anzusystems/common-admin'
import UserSelect from '@/views/coreDam/user/components/UserSelect.vue'

const { extSystem } = useExtSystemEditActions()

const { v$ } = useExtSystemValidation(extSystem)

const { t } = useI18n()
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <AFormTextField v-model="extSystem.name" :v="v$.extSystem.name" data-cy="ext-system-name" />
        </ARow>
        <ARow>
          <UserSelect
            v-model="extSystem.adminUsers"
            :label="t('coreDam.extSystem.model.adminUsers')"
            multiple
            data-cy="ext-system-admin-users"
            disable-init-fetch
          />
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
