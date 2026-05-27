<script lang="ts" setup>
import { ACard, useI18n } from '@anzusystems/common-admin'
import KeywordCreateButton from '@/views/coreDam/keyword/components/KeywordCreateButton.vue'
import KeywordDatatable from '@/views/coreDam/keyword/components/KeywordDatatable.vue'
import type AssetLicenceDatatable from '@/views/coreDam/assetLicence/components/AssetLicenceDatatable.vue'
import { useKeywordListActions } from '@/views/coreDam/keyword/composables/keywordActions'
import ActionbarWrapper from '@/components/wrappers/ActionbarWrapper.vue'
import { ACL } from '@/composables/auth/auth'

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const { listLoading } = useKeywordListActions()

const afterCreate = () => {
  setTimeout(() => {
    datatable.value?.refresh()
  }, 1000)
}

const { t } = useI18n()

const breadcrumbs = defineBreadcrumbs(
  computed(() => [{ title: t('breadcrumb.coreDam.keyword.list'), routeName: '/(coreDam)/keyword' }])
)
</script>

<template>
  <ActionbarWrapper :breadcrumbs="breadcrumbs">
    <template #buttons>
      <Acl :permission="ACL.DAM_KEYWORD_CREATE">
        <KeywordCreateButton data-cy="button-create" disable-redirect @on-success="afterCreate" />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <KeywordDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
