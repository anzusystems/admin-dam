<script lang="ts" setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AActionCloseButton, AActionSaveButton, stringToInt } from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { damClient } from '@/services/api/clients/damClient'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import AnzuUserEditForm from '@/views/common/anzuUser/components/AnzuUserEditForm.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { resetAnzuUserStore, fetchAnzuUser, updateAnzuUser, loadingAnzuUser } = useAnzuUserActions(damClient)

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
        :loading="loadingAnzuUser"
        @save-record="updateAnzuUser"
      />
      <AActionCloseButton :route-name="ROUTE.COMMON.ANZU_USER.LIST" />
    </template>
  </ActionbarWrapper>

  <AnzuUserEditForm :client="damClient" />
</template>
