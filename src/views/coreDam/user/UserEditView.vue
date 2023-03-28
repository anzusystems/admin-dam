<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, stringToInt } from '@anzusystems/common-admin'
import UserEditForm from '@/views/coreDam/user/components/UserEditForm.vue'
import { onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserEditActions } from '@/views/coreDam/user/composables/userActions'
import { ROUTE } from '@/router/routes'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt(route.params.id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate } =
  useUserEditActions()

const getData = () => {
  fetchData(id)
}

onMounted(() => {
  getData()
})

onBeforeUnmount(() => {
  resetStore()
})
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />

      <AActionCloseButton :route-name="ROUTE.DAM.USER.LIST" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <UserEditForm />
    </VCardText>
  </ACard>
</template>
