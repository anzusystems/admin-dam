<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  AAnzuUserForm,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useAnzuUserActions,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import DamUserFields from '@/domains/coreDam/user/components/DamUserFields.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import type { DamUser } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

definePage({
  path: '/users-new/:id(\\d+)',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ],
    layout: 'AppLayoutDrawer',
  },
})

const route = useRoute('/(coreDam)/users-new/[id]')
const id = stringToInt(route.params.id)

const { can } = useAuth()
const { anzuUser, loadingAnzuUser, fetchAnzuUser, resetAnzuUserStore } = useAnzuUserActions({
  client: damClient,
  system: 'dam',
  entity: damUserSystemDescriptor.entity,
  endPoint: damUserSystemDescriptor.endpoints.list,
})

// The store's record is typed as the library's `AnzuUser`; in dam the very same row also carries
// the licence and ext-system fields, which `DamUserDto` adds on the backend. One cast, here.
const damUser = anzuUser as unknown as Ref<DamUser>

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.anzuUser.list'), routeName: '/(coreDam)/users-new' },
    {
      title: anzuUser.value.person.fullName || anzuUser.value.email || t('breadcrumb.anzuUser.detail'),
      routeName: '/(coreDam)/users-new/[id]',
      id,
    },
  ])
)

onMounted(() => {
  fetchAnzuUser(id)
})

onBeforeUnmount(() => {
  resetAnzuUserStore('dam')
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionEditButton
        v-if="!loadingAnzuUser && can(ACL.DAM_USER_UPDATE)"
        :record-id="id"
        :route-name="'/(coreDam)/users-new/[id]/edit'"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/users-new'"
        :skip-route-names="['/(coreDam)/users-new/[id]/edit', '/(coreDam)/users-new/new']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="loadingAnzuUser">
    <VCardText>
      <!-- One component for detail and edit; this is the same form in its viewing mode. -->
      <AAnzuUserForm
        v-model:user="anzuUser"
        :client="damClient"
        system="dam"
        :permission-group-end-point="damUserSystemDescriptor.endpoints.permissionGroup"
        :required-metadata="damUserSystemDescriptor.requiredMetadata"
        :id-input="damUserSystemDescriptor.idInput"
        :enabled-note="damUserSystemDescriptor.enabledNote"
        :metadata-note="damUserSystemDescriptor.metadataNote"
        is-edit
        readonly
      >
        <template #systemFields="{ readonly: fieldsReadonly }">
          <!-- The dam half of the same record; one save writes both. -->
          <DamUserFields
            v-model:user="damUser"
            :readonly="fieldsReadonly"
          />
        </template>
      </AAnzuUserForm>
      <DamTrackingFields :data="anzuUser" />
    </VCardText>
  </ACard>
</template>
