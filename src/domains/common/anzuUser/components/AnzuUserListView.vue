<script lang="ts" setup>
import { ACard, defineBreadcrumbs, useI18n } from '@anzusystems/common-admin'
import { computed, ref } from 'vue'

import AnzuUserCreateButton from '@/domains/common/anzuUser/components/AnzuUserCreateButton.vue'
import AnzuUserDatatable from '@/domains/common/anzuUser/components/AnzuUserDatatable.vue'
import { useAnzuUserActions } from '@/domains/common/anzuUser/composables/anzuUserActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { damClient } from '@/shared/apiClients/damClient'

const datatable = ref<InstanceType<typeof AnzuUserDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
const { listLoading } = useAnzuUserActions()

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.anzuUser.list'), routeName: '/(common)/anzu-users' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_USER_CREATE">
        <AnzuUserCreateButton
          data-cy="button-create"
          disable-redirect
          :client="damClient"
          @after-create="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AnzuUserDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
