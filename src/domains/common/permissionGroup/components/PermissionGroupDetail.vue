<script lang="ts" setup>
import { ACopyText, ARow } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import PermissionEditor from '@/domains/common/permission/components/PermissionEditor.vue'
import { usePermissionGroupOneStore } from '@/domains/common/permissionGroup/store/permissionGroupStore'
import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'

defineProps<{
  client: () => AxiosInstance
}>()

const { permissionGroup } = storeToRefs(usePermissionGroupOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol
      cols="12"
      sm="8"
    >
      <VRow>
        <VCol cols="12">
          <ARow
            :title="t('common.permissionGroup.model.title')"
            :value="permissionGroup.title"
          />
          <ARow
            :title="t('common.permissionGroup.model.description')"
            :value="permissionGroup.description"
          />
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <PermissionEditor
            v-model="permissionGroup.permissions"
            :client="client"
          />
        </VCol>
      </VRow>
    </VCol>
    <VCol
      cols="12"
      sm="4"
    >
      <ARow :title="t('common.permissionGroup.model.id')">
        <ACopyText :value="permissionGroup.id" />
      </ARow>
      <DamTrackingFields :data="permissionGroup" />
    </VCol>
  </VRow>
</template>
