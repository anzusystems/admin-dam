<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionSaveButton, ACard, defineBreadcrumbs, stringToInt, useI18n } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserEditForm from '@/views/common/anzuUser/components/AnzuUserEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { resetAnzuUserStore, fetchAnzuUser, updateAnzuUser, detailLoading, saveButtonLoading } =
  useAnzuUserActions(damClient)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.anzuUser.list'), routeName: '/(common)/anzu-user' },
    {
      title: t('breadcrumb.anzuUser.edit'),
      routeName: '/(common)/anzu-user/[id]/edit',
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
      <AActionCloseButton :route-name="'/(common)/anzu-user'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
