<script lang="ts" setup>
import { ACard } from '@anzusystems/common-admin'
import KeywordCreateButton from '@/views/coreDam/keyword/components/KeywordCreateButton.vue'
import KeywordDatatable from '@/views/coreDam/keyword/components/KeywordDatatable.vue'
import { ref } from 'vue'
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
</script>

<template>
  <ActionbarWrapper>
    <template #buttons>
      <Acl :permission="ACL.DAM_KEYWORD_CREATE">
        <KeywordCreateButton
          data-cy="button-create"
          disable-redirect
          @on-success="afterCreate"
        />
      </Acl>
    </template>
  </ActionbarWrapper>

  <ACard :loading="listLoading">
    <VCardText>
      <KeywordDatatable ref="datatable" />
    </VCardText>
  </ACard>
</template>
