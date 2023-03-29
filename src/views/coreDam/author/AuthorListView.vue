<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import AuthorDatatable from '@/views/coreDam/author/components/AuthorDatatable.vue'
import AuthorCreateButton from '@/views/coreDam/author/components/AuthorCreateButton.vue'
import { ref } from 'vue'
import type AssetLicenceDatatable from '@/views/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import { useAuthorListActions } from '@/views/coreDam/author/composables/authorActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'

const { t } = useI18n()

const { listLoading } = useAuthorListActions()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarWrapper>
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
