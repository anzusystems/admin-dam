<script lang="ts" setup>
import { ACopyText, ARow, AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePermissionGroupOneStore } from '@/stores/common/permissionGroupStore'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'

defineProps<{
  client: () => AxiosInstance
}>()

const { permissionGroup } = storeToRefs(usePermissionGroupOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="12" sm="8">
      <VRow>
        <VCol cols="12">
          <ARow :title="t('common.permissionGroup.model.title')" :value="permissionGroup.title" />
          <ARow :title="t('common.permissionGroup.model.description')" :value="permissionGroup.description" />
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <PermissionEditor v-model="permissionGroup.permissions" :client="client" />
        </VCol>
      </VRow>
    </VCol>
    <VCol cols="12" sm="4">
      <ARow :title="t('common.permissionGroup.model.id')">
        <ACopyText :value="permissionGroup.id" />
      </ARow>
      <AUserAndTimeTrackingFields :data="permissionGroup" />
    </VCol>
  </VRow>
</template>
