<script lang="ts" setup>
import ACard from '@/components/common/ACard.vue'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import AuthorDatatable from '@/views/dam/author/components/AuthorDatatable.vue'
import AuthorCreateButton from '@/views/dam/author/components/AuthorCreateButton.vue'
import { ref } from 'vue'
import AssetLicenceDatatable from '@/views/dam/assetLicence/components/AssetLicenceDatatable.vue'

const { t } = useI18n({ useScope: 'global' })

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const afterCreate = () => {
  datatable.value?.refresh()
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.author.meta.list')" icon="mdi-account-circle-outline" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_AUTHOR_CREATE">
      <AuthorCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard loader="list">
    <AuthorDatatable ref="datatable" />
  </ACard>
</template>
