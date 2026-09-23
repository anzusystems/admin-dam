<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionEditButton,
  ACard,
  ARow,
  AUserAndTimeTrackingFields,
  useDamCachedUsers,
  AAnzuUserForm,
  useAnzuUserActions,
} from '@anzusystems/common-admin'
import DamUserFields from '@/domains/coreDam/user/components/DamUserFields.vue'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { damUserSystemDescriptor, type DamUser } from '@/domains/system/descriptors/userSystemDescriptor'
import CachedDamUserChip from '@/domains/coreDam/shared/components/CachedDamUserChip.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

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

// `CachedDamUserChip` draws from the user cache and never loads it itself: without this the two chips
// spin for good. The old detail loaded them on every fetch.
const { addToCachedUsers, fetchCachedUsers } = useDamCachedUsers()
watch(
  () => [anzuUser.value.createdBy, anzuUser.value.modifiedBy] as const,
  ([createdBy, modifiedBy]) => {
    addToCachedUsers(createdBy, modifiedBy)
    void fetchCachedUsers()
  },
  { immediate: true }
)

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
      <!-- Created and modified by whom, as the dam detail this replaces showed it. -->
      <ARow :title="t('coreDam.user.model.createdBy')">
        <CachedDamUserChip :id="anzuUser.createdBy" />
      </ARow>
      <ARow :title="t('coreDam.user.model.modifiedBy')">
        <CachedDamUserChip :id="anzuUser.modifiedBy" />
      </ARow>
      <AUserAndTimeTrackingFields :data="anzuUser" />
    </VCardText>
  </ACard>
</template>
