<script lang="ts" setup>
import {
  AActionCloseButtonHistory,
  AActionSaveAndCloseButton,
  AActionSaveButton,
  ACard,
} from '@anzusystems/common-admin'
import { AAnzuUserForm, useAnzuUserActions } from '@anzusystems/common-admin/labs'
import { ACL } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'
import { damUserSystemDescriptor } from '@/domains/system/descriptors/userSystemDescriptor'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

definePage({
  meta: {
    requiresAuth: true,
    requiredPermissions: [ACL.DAM_USER_CREATE],
    layout: 'AppLayoutDrawer',
  },
})

const { anzuUser, loadingAnzuUser, createAnzuUser, loadingCreateAnzuUser, resetAnzuUserStore } = useAnzuUserActions({
  client: damClient,
  system: 'dam',
  entity: damUserSystemDescriptor.entity,
  endPoint: damUserSystemDescriptor.endpoints.list,
})

const router = useRouter()

const onCreate = async (close = false) => {
  const created = await createAnzuUser()
  if (isNull(created)) return
  if (close) {
    router.push({ name: '/(coreDam)/users-new' })

    return
  }
  router.push({ name: '/(coreDam)/users-new/[id]', params: { id: String(created.id) } })
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.anzuUser.list'), routeName: '/(coreDam)/users-new' },
    { title: anzuUser.value.email || t('breadcrumb.anzuUser.create'), routeName: '/(coreDam)/users-new/new' },
  ])
)

onMounted(() => {
  // The library factory decides what a new account starts as: no roles, switched off.
  resetAnzuUserStore('dam')
})

onBeforeUnmount(() => {
  resetAnzuUserStore('dam')
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        :loading="loadingCreateAnzuUser"
        @save-record="onCreate()"
      />
      <AActionSaveAndCloseButton
        :loading="loadingCreateAnzuUser"
        @save-record-and-close="onCreate(true)"
      />
      <AActionCloseButtonHistory :fallback-route-name="'/(coreDam)/users-new'" />
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
        random-color
      />
      <!--
        No dam fields here, only on edit. `POST /adm/users` takes a plain `UserDto` and
        `createAnzuUser` writes nothing else, so licences and ext systems typed in at this point were
        dropped without a word. The page this replaces never offered them either.
      -->
    </VCardText>
  </ACard>
</template>
