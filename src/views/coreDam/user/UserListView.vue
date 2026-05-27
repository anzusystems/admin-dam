<script lang="ts" setup>
import UserDatatable from '@/views/coreDam/user/components/UserDatatable.vue'
import { ACard, useI18n } from '@anzusystems/common-admin'
import { useUserListActions } from '@/views/coreDam/user/composables/userActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { listLoading } = useUserListActions()

const datatable = ref<InstanceType<typeof UserDatatable> | null>(null)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.user.list'), routeName: '/(coreDam)/user' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs" />

  <ACard :loading="listLoading">
    <VCardText>
      <UserDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
