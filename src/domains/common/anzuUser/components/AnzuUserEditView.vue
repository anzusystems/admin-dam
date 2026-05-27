<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import { damClient } from '@/shared/apiClients/damClient'
import { useAnzuUserActions } from '@/domains/common/anzuUser/composables/anzuUserActions'
import AnzuUserEditForm from '@/domains/common/anzuUser/components/AnzuUserEditForm.vue'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { resetAnzuUserStore, fetchAnzuUser, updateAnzuUser, detailLoading, saveButtonLoading } =
  useAnzuUserActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.anzuUser.list'), routeName: '/(common)/anzu-users' },
    {
      title: t('breadcrumb.anzuUser.edit'),
      routeName: '/(common)/anzu-users/[id]/edit',
    },
  ])
)

const getData = () => {
  fetchAnzuUser(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetAnzuUserStore()
})
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        :loading="saveButtonLoading"
        @save-record="updateAnzuUser"
      />
      <AActionCloseButton :route-name="'/(common)/anzu-users'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
