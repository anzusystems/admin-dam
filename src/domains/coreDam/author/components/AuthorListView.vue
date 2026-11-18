<script lang="ts" setup>
import { ACard, ADamAuthorCreateButton, defineBreadcrumbs } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type AssetLicenceDatatable from '@/domains/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import AuthorDatatable from '@/domains/coreDam/author/components/AuthorDatatable.vue'
import { useAuthorListActions } from '@/domains/coreDam/author/composables/authorActions'
import { ACL } from '@/domains/system/auth/auth'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'

const { listLoading } = useAuthorListActions()
const { currentExtSystemId } = useCurrentExtSystem()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(() => [
  { title: t('breadcrumb.coreDam.author.list'), routeName: '/(coreDam)/authors' },
])
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_AUTHOR_CREATE">
        <ADamAuthorCreateButton
          :ext-system="currentExtSystemId"
          data-cy="button-create"
          @success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <AuthorDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
