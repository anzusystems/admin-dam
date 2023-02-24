<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import ActionbarButtonsWrapper from '@/components/wrappers/ActionbarButtonsWrapper.vue'
import { useI18n } from 'vue-i18n'
import { ACL } from '@/types/Permission'
import ActionbarTitleWrapper from '@/components/wrappers/ActionbarTitleWrapper.vue'
import KeywordCreateButton from '@/views/dam/keyword/components/KeywordCreateButton.vue'
import KeywordDatatable from '@/views/dam/keyword/components/KeywordDatatable.vue'
import { ref } from 'vue'
import type AssetLicenceDatatable from '@/views/dam/assetLicence/components/AssetLicenceDatatable.vue'
import { useKeywordListActions } from '@/views/dam/keyword/composables/keywordActions'

const { t } = useI18n()

const datatable = ref<InstanceType<typeof AssetLicenceDatatable> | null>(null)

const { listLoading } = useKeywordListActions()

const afterCreate = () => {
  // todo check why timeout is needed
  setTimeout(() => {
    datatable.value?.refresh()
  }, 1000)
}
</script>

<template>
  <ActionbarTitleWrapper :heading="t('coreDam.keyword.meta.list')" />
  <ActionbarButtonsWrapper>
    <Acl :permission="ACL.DAM_KEYWORD_CREATE">
      <KeywordCreateButton data-cy="button-create" disable-redirect @after-create="afterCreate" />
    </Acl>
  </ActionbarButtonsWrapper>
  <ACard :loading="listLoading">
    <KeywordDatatable ref="datatable" />
  </ACard>
</template>
