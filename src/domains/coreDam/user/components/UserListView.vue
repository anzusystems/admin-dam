<script lang="ts" setup>
import { ACard, defineBreadcrumbs } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import UserDatatable from '@/domains/coreDam/user/components/UserDatatable.vue'
import { useUserListActions } from '@/domains/coreDam/user/composables/userActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { listLoading } = useUserListActions()

const datatable = ref<InstanceType<typeof UserDatatable> | null>(null)

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.user.list'), routeName: '/(coreDam)/users' }])
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
