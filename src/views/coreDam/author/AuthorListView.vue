<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import AuthorDatatable from '@/views/coreDam/author/components/AuthorDatatable.vue'
import AuthorCreateButton from '@/views/coreDam/author/components/AuthorCreateButton.vue'
import { ref } from 'vue'
import type AssetLicenceDatatable from '@/views/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import { useAuthorListActions } from '@/views/coreDam/author/composables/authorActions'

const { t } = useI18n()

const { listLoading } = useAuthorListActions()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.author.meta.list')" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_AUTHOR_CREATE">
      <AuthorCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard :loading="listLoading">
    <AuthorDatatable ref="datatable" />
  </ACard>
</template>
