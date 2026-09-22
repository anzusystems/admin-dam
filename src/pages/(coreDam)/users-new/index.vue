<script lang="ts" setup>
import { AActionCreateButton, ACard } from '@anzusystems/common-admin'
import { AAnzuUserDatatable, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import PermissionGroupRemoteSelect from '@/domains/common/permissionGroup/components/PermissionGroupRemoteSelect.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ],
    layout: 'AppLayoutDrawer',
  },
})

const { can } = useAuth()
const router = useRouter()

const { t } = useI18n()

// The two filters the shared three do not cover. `custom` and not cms's `memberOf`: the same
// question, a different query per backend.
const filterFields = [
  {
    name: 'lastName' as const,
    default: null,
    type: 'string',
    variant: 'startsWith',
    apiName: 'person.lastName',
    // The filter's subject is the library's `common.anzuUser`, which has no key for this one.
    titleT: 'coreDam.user.model.lastName',
  },
  { name: 'permissionGroups' as const, default: [], type: 'string', variant: 'custom' },
] satisfies readonly MakeFilterOption[]

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.anzuUser.list'), routeName: '/(coreDam)/users-new' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionCreateButton
        v-if="can(ACL.DAM_USER_CREATE)"
        :route-name="'/(coreDam)/users-new/new'"
      />
    </template>
  </ActionbarWrapper>

  <ACard>
    <VCardText>
      <!-- The owning system's own list, so the buttons are gated with `<Acl>` exactly as before. -->
      <AAnzuUserDatatable
        :client="damClient"
        system="dam"
        :entity="damUserSystemDescriptor.entity"
        :end-point="damUserSystemDescriptor.endpoints.list"
        :can-update="can(ACL.DAM_USER_UPDATE)"
        :detail-route="(user) => ({ name: '/(coreDam)/users-new/[id]', params: { id: String(user.id) } })"
        :edit-route="(user) => ({ name: '/(coreDam)/users-new/[id]/edit', params: { id: String(user.id) } })"
        :system-columns="[
          { key: 'person.firstName', title: t('coreDam.user.model.firstName') },
          { key: 'person.lastName', title: t('coreDam.user.model.lastName') },
        ]"
        :filter-fields="filterFields"
        :filter-client="damClient"
        @row-click="(user) => router.push({ name: '/(coreDam)/users-new/[id]', params: { id: String(user.id) } })"
      >
        <template #filter.permissionGroups>
          <PermissionGroupRemoteSelect name="permissionGroups" />
        </template>
        <template #systemColumns="{ column, user }">
          {{ column === 'person.firstName' ? user.person.firstName : user.person.lastName }}
        </template>
      </AAnzuUserDatatable>
    </VCardText>
  </ACard>
</template>
