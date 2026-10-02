<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveButton,
  AAnzuUserForm,
  ACard,
  defineBreadcrumbs,
  stringToInt,
  useAnzuUserActions,
  useRecordPage,
} from '@anzusystems/common-admin'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import DamTrackingFields from '@/domains/coreDam/shared/components/DamTrackingFields.vue'
import DamUserFields from '@/domains/coreDam/user/components/DamUserFields.vue'
import { ACL } from '@/domains/system/auth/auth'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import type { DamUser } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

definePage({
  path: '/users-new/:id(\\d+)/edit',
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_READ, ACL.DAM_USER_UPDATE],
    layout: 'AppLayoutDrawer',
  },
})

const route = useRoute('/(coreDam)/users-new/[id]/edit')
const id = stringToInt(route.params.id)

const { anzuUser, loadingAnzuUser, loadingUpdateAnzuUser, fetchAnzuUser, updateAnzuUser, resetAnzuUserStore } =
  useAnzuUserActions({
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
      title: anzuUser.value.person.fullName || anzuUser.value.email || t('breadcrumb.anzuUser.edit'),
      routeName: '/(coreDam)/users-new/[id]/edit',
      id,
    },
  ])
)

const { signal, leave } = useRecordPage({
  fallbackRouteName: '/(coreDam)/users-new',
  skipRouteNames: ['/(coreDam)/users-new/[id]', '/(coreDam)/users-new/new'],
  loading: loadingAnzuUser,
})

onMounted(async () => {
  if ((await fetchAnzuUser(id, { signal })) === false) await leave()
})

onBeforeUnmount(() => {
  resetAnzuUserStore('dam')
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!loadingAnzuUser"
        :loading="loadingUpdateAnzuUser"
        @save-record="updateAnzuUser"
      />
      <AActionCloseButtonHistory
        :fallback-route-name="'/(coreDam)/users-new'"
        :skip-route-names="['/(coreDam)/users-new/[id]', '/(coreDam)/users-new/new']"
      />
    </template>
  </ActionbarWrapper>

  <ACard :loading="loadingAnzuUser">
    <VCardText>
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
        random-color
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
