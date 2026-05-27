<script lang="ts" setup>
import { ACard, useI18n } from '@anzusystems/common-admin'
import AuthorDatatable from '@/domains/coreDam/author/components/AuthorDatatable.vue'
import AuthorCreateButton from '@/domains/coreDam/author/components/AuthorCreateButton.vue'
import type AssetLicenceDatatable from '@/domains/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import { useAuthorListActions } from '@/domains/coreDam/author/composables/authorActions'
import ActionbarWrapper from '@/layouts/ActionbarWrapper.vue'
import { ACL } from '@/domains/system/auth/auth'

const { listLoading } = useAuthorListActions()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.author.list'), routeName: '/(coreDam)/authors' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_AUTHOR_CREATE">
        <AuthorCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
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
