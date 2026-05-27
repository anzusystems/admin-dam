<script lang="ts" setup>
import { AActionCloseButton, AActionSaveButton, ACard, useI18n } from '@anzusystems/common-admin'
import UserEditForm from '@/views/coreDam/user/components/UserEditForm.vue'
import { useUserEditActions } from '@/views/coreDam/user/composables/userActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const route = useRoute()
const id = stringToInt((route.params as { id: string }).id)

const { detailLoading, saveButtonLoading, saveAndCloseButtonLoading, fetchData, resetStore, onUpdate, user } =
  useUserEditActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [
    { title: t('breadcrumb.coreDam.user.list'), routeName: '/(coreDam)/users' },
    {
      title: user.value.id + '' || t('breadcrumb.coreDam.user.edit'),
      routeName: '/(coreDam)/users/[id]/edit',
    },
  ])
)

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
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <AActionSaveButton
        v-if="!detailLoading"
        :loading="saveButtonLoading"
        :disabled="saveAndCloseButtonLoading"
        @save-record="onUpdate"
      />

      <AActionCloseButton :route-name="'/(coreDam)/users'" />
    </template>
  </ActionbarWrapper>

  <ACard :loading="detailLoading">
    <VCardText>
      <UserEditForm />
    </VCardText>
  </ACard>
</template>
