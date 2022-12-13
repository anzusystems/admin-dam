<script lang="ts" setup>
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/extSystemApi'
import { useI18n } from 'vue-i18n'
import { useExtSystemEditActions } from '@/views/dam/extSystem/composables/extSystemActions'
import { useExtSystemValidation } from '@/views/dam/extSystem/composables/extSystemValidation'
import ASystemEntityScope from '@/components/form/ASystemEntityScope.vue'
import ATextField from '@/components/form/ATextField.vue'
import ARow from '@/components/common/ARow.vue'
import UserSelect from '@/views/dam/user/components/UserSelect.vue'

const { extSystem } = useExtSystemEditActions()

const { v$ } = useExtSystemValidation(extSystem)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <ASystemEntityScope :system="SYSTEM_CORE_DAM" :subject="ENTITY">
    <VRow>
      <VCol cols="12" md="8">
        <ARow>
          <ATextField v-model="extSystem.name" :v="v$.extSystem.name" data-cy="ext-system-name"></ATextField>
        </ARow>
        <ARow>
          <ATextField v-model="extSystem.slug" :v="v$.extSystem.slug" data-cy="ext-system-slug"></ATextField>
        </ARow>
        <ARow>
          <UserSelect
            :label="t('coreDam.extSystem.model.adminUsers')"
            multiple
            v-model="extSystem.adminUsers"
            data-cy="ext-system-admin-users"
          ></UserSelect>
        </ARow>
      </VCol>
    </VRow>
  </ASystemEntityScope>
</template>
