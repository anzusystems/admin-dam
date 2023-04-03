<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionSaveButton, ACard, stringToInt } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { damClient } from '@/services/api/clients/damClient'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserEditForm from '@/views/common/anzuUser/components/AnzuUserEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { resetAnzuUserStore, fetchAnzuUser, updateAnzuUser, detailLoading, saveButtonLoading } =
  useAnzuUserActions(damClient)

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
  <ActionbarWrapper>
    <template #buttons>
      <AActionSaveButton
        :loading="saveButtonLoading"
        @save-record="updateAnzuUser"
      />
      <AActionCloseButton :route-name="ROUTE.COMMON.ANZU_USER.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <AnzuUserEditForm :client="damClient" />
    </VCardText>
  </ACard>
</template>
