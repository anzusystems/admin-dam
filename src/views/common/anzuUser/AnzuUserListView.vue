<script lang="ts" setup>
import { damClient } from '@/services/api/clients/damClient'
import AnzuUserDatatable from '@/views/common/anzuUser/components/AnzuUserDatatable.vue'
import AnzuUserCreateButton from '@/views/common/anzuUser/components/AnzuUserCreateButton.vue'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { useAnzuUserActions } from '@/views/common/anzuUser/composables/anzuUserActions'
import { ACard, useI18n } from '@anzusystems/common-admin'
import { ACL } from '@/composables/auth/auth'

const datatable = ref<InstanceType<typeof AnzuUserDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
const { listLoading } = useAnzuUserActions(damClient)

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
