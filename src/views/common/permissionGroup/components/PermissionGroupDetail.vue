<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { ACopyText } from '@anzusystems/common-admin'
import { ARow } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { usePermissionGroupOneStore } from '@/stores/common/permissionGroupStore'
import { AUserAndTimeTrackingFields } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'

defineProps<{
  client: () => AxiosInstance
}>()

const { permissionGroup, loadingPermissionGroup } = storeToRefs(usePermissionGroupOneStore())

const { t } = useI18n()
</script>

<template>
  <VRow>
    <VCol cols="12" sm="8">
      <VRow>
        <VCol cols="12">
          <ACard :loading="loadingPermissionGroup">
            <VCardText>
              <ARow :title="t('common.permissionGroup.model.title')" :value="permissionGroup.title" />
              <ARow :title="t('common.permissionGroup.model.description')" :value="permissionGroup.description" />
            </VCardText>
          </ACard>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12">
          <PermissionEditor v-model="permissionGroup.permissions" :client="client" />
        </VCol>
      </VRow>
    </VCol>
    <VCol cols="12" sm="4">
      <ACard loader="detail">
        <ARow :title="t('common.permissionGroup.model.id')">
          <ACopyText :value="permissionGroup.id" />
        </ARow>
        <AUserAndTimeTrackingFields :data="permissionGroup" />
      </ACard>
    </VCol>
  </VRow>
</template>
