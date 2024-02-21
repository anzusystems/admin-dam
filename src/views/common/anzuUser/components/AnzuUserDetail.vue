<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useAnzuUserOneStore } from '@/stores/common/anzuUserStore'
import { storeToRefs } from 'pinia'
import { ABooleanValue, AChipNoLink, ACopyText } from '@anzusystems/common-admin'
import CachedPermissionGroupChip from '@/views/common/permissionGroup/components/CachedPermissionGroupChip.vue'
import type { AxiosInstance } from 'axios'
import PermissionEditor from '@/views/common/permission/components/PermissionEditor.vue'
import { usePermissionConfigActions } from '@/views/common/permission/composables/permissionConfigActions'

const props = defineProps<{
  client: () => AxiosInstance
}>()

const { anzuUser } = storeToRefs(useAnzuUserOneStore())
// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const { translatePermission } = usePermissionConfigActions(props.client)

const { t } = useI18n()
</script>

<template>
  <div>
    <VRow>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.id') }}</h4>
        <ACopyText :value="`${anzuUser.id}`" />
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.email') }}</h4>
        {{ anzuUser.email }}
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.enabled') }}</h4>
        <ABooleanValue
          :value="anzuUser.enabled"
          chip
        />
      </VCol>
    </VRow>
    <VRow>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.person.firstName') }}</h4>
        {{ anzuUser.person.firstName }}
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.person.lastName') }}</h4>
        {{ anzuUser.person.lastName }}
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.person.fullName') }}</h4>
        {{ anzuUser.person.fullName }}
      </VCol>
    </VRow>
    <VRow>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.avatar.text') }}</h4>
        {{ anzuUser.avatar.text }}
      </VCol>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.avatar.color') }}</h4>
        {{ anzuUser.avatar.color }}
      </VCol>
    </VRow>
    <VRow>
      <VCol
        cols="12"
        sm="4"
      >
        <h4>{{ t('common.anzuUser.model.roles') }}</h4>
        <AChipNoLink
          v-for="role in anzuUser.roles"
          :key="role"
          class="mr-1 mb-1"
        >
          {{ translatePermission('roles', role) }}
        </AChipNoLink>
      </VCol>
      <VCol
        v-if="anzuUser.permissionGroups.length > 0"
        cols="12"
        sm="8"
      >
        <h4>{{ t('common.anzuUser.model.permissionGroups') }}</h4>
        <CachedPermissionGroupChip
          v-for="permissionGroupId in anzuUser.permissionGroups"
          :id="permissionGroupId"
          :key="permissionGroupId"
          class="mr-1 mb-1"
        />
      </VCol>
    </VRow>
    <PermissionEditor
      v-model="anzuUser.permissions"
      :resolved-permissions="anzuUser.resolvedPermissions"
      :roles="anzuUser.roles"
      :client="client"
      class="mt-3"
    />
  </div>
</template>
